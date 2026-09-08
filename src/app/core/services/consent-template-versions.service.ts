import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from '@angular/fire/firestore';
import { ConsentField, ConsentStepDefinition, ConsentTemplateVersion } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';
import { AuditService } from './audit.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';

/**
 * Consent template versions are append-only: a published version's `steps`
 * and `fields` must never be edited in place. Editing a live form always
 * means "create the next draft version, edit that, publish it" — so every
 * ConsentSubmission that references an older version keeps showing exactly
 * the wording/questions the client actually signed.
 */
@Injectable({ providedIn: 'root' })
export class ConsentTemplateVersionsService extends FirestoreBaseRepository<ConsentTemplateVersion> {
  protected readonly path = 'consentTemplateVersions';
  private readonly audit = inject(AuditService);
  private readonly dispatcher = inject(NotificationDispatcherService);

  listForTemplate(templateId: string) {
    return this.list(where('templateId', '==', templateId), orderBy('versionNumber', 'asc'));
  }

  /** Creates a brand-new draft version, cloning steps/fields from the given source version if provided. */
  async createDraft(
    templateId: string,
    fromVersion?: Pick<ConsentTemplateVersion, 'steps' | 'fields'>,
  ): Promise<string> {
    const existing = await getDocs(
      query(collection(this.firestore, this.path), where('templateId', '==', templateId)),
    );
    const nextVersionNumber = existing.size + 1;
    return this.create({
      templateId,
      versionNumber: nextVersionNumber,
      status: 'draft',
      steps: fromVersion?.steps ?? [],
      fields: fromVersion?.fields ?? [],
      publishedAt: null,
      publishedBy: null,
    } as any);
  }

  async updateDraft(versionId: string, steps: ConsentStepDefinition[], fields: ConsentField[]): Promise<void> {
    await this.update(versionId, { steps, fields } as any);
  }

  /** Publishes a draft: marks it published, archives whatever was previously published, flips the template pointer. */
  async publish(templateId: string, versionId: string): Promise<void> {
    const uid = this.auth.currentUid();
    await runTransaction(this.firestore, async (tx) => {
      const templateRef = doc(this.firestore, `consentTemplates/${templateId}`);
      const versionRef = this.docRef(versionId);
      const templateSnap = await tx.get(templateRef);
      const currentPublishedId = templateSnap.data()?.['currentPublishedVersionId'] as string | null | undefined;

      if (currentPublishedId) {
        const prevRef = this.docRef(currentPublishedId);
        tx.update(prevRef, { status: 'archived', updatedAt: serverTimestamp(), updatedBy: uid });
      }
      tx.update(versionRef, {
        status: 'published',
        publishedAt: new Date().toISOString(),
        publishedBy: uid,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
      tx.update(templateRef, {
        currentPublishedVersionId: versionId,
        draftVersionId: null,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    });
    await this.audit.log('publish', 'consentTemplateVersion', versionId, `Published consent form version for template ${templateId}`);
    void this.dispatcher.notifyAdmins({
      type: 'consent_form_published',
      title: 'Consent form published',
      body: `A consent form version was published for template ${templateId}.`,
      link: `/admin/consent-forms?template=${templateId}`,
      entityType: 'consentTemplate',
      entityId: templateId,
    }).catch(() => undefined);
  }
}
