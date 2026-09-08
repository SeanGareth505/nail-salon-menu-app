import { inject, Injectable } from '@angular/core';
import { Firestore, doc, runTransaction, serverTimestamp } from '@angular/fire/firestore';
import {
  BUILT_IN_CONSENT_TEMPLATES,
  DEFAULT_CONSENT_TEMPLATE_ID,
  GENERAL_CONSENT_TEMPLATE,
  GENERAL_CONSENT_TEMPLATE_ID,
  NAIL_CONSENT_TEMPLATE,
  canUpgradeBuiltInConsentTemplate,
  isBundledConsentVersion,
  type DefaultConsentTemplateManifest,
} from '../consent/default-consent-template';
import { ConsentTemplate, ConsentTemplateVersion } from '../models';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class DefaultConsentTemplateService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);
  private ensurePromise: Promise<string[]> | null = null;

  async ensureDefaultTemplate(): Promise<string> {
    const ids = await this.ensureBuiltInTemplates();
    return ids[0] ?? DEFAULT_CONSENT_TEMPLATE_ID;
  }

  async ensureBuiltInTemplates(): Promise<string[]> {
    if (!this.ensurePromise) {
      this.ensurePromise = this.doEnsureAll().catch((error) => {
        this.ensurePromise = null;
        throw error;
      });
    }
    return this.ensurePromise;
  }

  private async doEnsureAll(): Promise<string[]> {
    const uid = this.auth.currentUid();
    await this.ensureTemplate(NAIL_CONSENT_TEMPLATE, { isSystemDefault: true, uid });
    await this.ensureTemplate(GENERAL_CONSENT_TEMPLATE, { isSystemDefault: false, uid });
    return BUILT_IN_CONSENT_TEMPLATES.map((template) => template.templateId);
  }

  private async ensureTemplate(
    manifest: DefaultConsentTemplateManifest,
    options: { isSystemDefault: boolean; uid: string | null },
  ): Promise<void> {
    const templateId = manifest.templateId;
    const versionId = manifest.versionId;
    const versionNumber = manifest.versionNumber ?? 1;
    const templateRef = doc(this.firestore, `consentTemplates/${templateId}`);
    const versionRef = doc(this.firestore, `consentTemplateVersions/${versionId}`);
    const { isSystemDefault, uid } = options;

    await runTransaction(this.firestore, async (tx) => {
      const templateSnap = await tx.get(templateRef);
      const template = templateSnap.exists()
        ? ({ ...templateSnap.data(), id: templateSnap.id } as ConsentTemplate)
        : undefined;
      const currentId = template?.currentPublishedVersionId;
      const currentSnap = currentId
        ? await tx.get(doc(this.firestore, `consentTemplateVersions/${currentId}`))
        : undefined;
      const current = currentSnap?.exists()
        ? ({ ...currentSnap.data(), id: currentSnap.id } as ConsentTemplateVersion)
        : undefined;

      const upgrade =
        templateId === GENERAL_CONSENT_TEMPLATE_ID &&
        canUpgradeBuiltInConsentTemplate(template, current);

      const audit = { updatedAt: serverTimestamp(), updatedBy: uid };

      if (template && !upgrade && (currentId || template.draftVersionId)) {
        const patch: Record<string, unknown> = {};
        if (currentId && template.active !== true) {
          patch['active'] = true;
        }
        if (
          isSystemDefault &&
          template.isSystemDefault !== true &&
          !template.draftVersionId
        ) {
          const generalRef = doc(this.firestore, `consentTemplates/${GENERAL_CONSENT_TEMPLATE_ID}`);
          const generalSnap = await tx.get(generalRef);
          if (generalSnap.exists() && generalSnap.data()['isSystemDefault'] === true) {
            tx.update(generalRef, { isSystemDefault: false, ...audit });
          }
          patch['isSystemDefault'] = true;
        }
        if (Object.keys(patch).length) {
          tx.update(templateRef, { ...patch, ...audit });
        }
        return;
      }

      const versionSnap = await tx.get(versionRef);
      if (
        versionSnap.exists() &&
        (versionSnap.data()['status'] !== 'published' ||
          !isBundledConsentVersion({
            ...versionSnap.data(),
            id: versionSnap.id,
          } as ConsentTemplateVersion))
      ) {
        if (template && template.active !== true && (currentId || versionSnap.exists())) {
          tx.update(templateRef, { active: true, ...audit });
        }
        return;
      }

      if (!versionSnap.exists()) {
        tx.set(versionRef, {
          templateId,
          versionNumber,
          status: 'published',
          steps: manifest.steps,
          fields: manifest.fields,
          publishedAt: new Date().toISOString(),
          publishedBy: uid,
          createdAt: serverTimestamp(),
          createdBy: uid,
          ...audit,
        });
      }

      if (upgrade && currentId) {
        tx.update(doc(this.firestore, `consentTemplateVersions/${currentId}`), {
          status: 'archived',
          ...audit,
        });
      }

      if (isSystemDefault) {
        const generalRef = doc(this.firestore, `consentTemplates/${GENERAL_CONSENT_TEMPLATE_ID}`);
        const generalSnap = await tx.get(generalRef);
        if (generalSnap.exists() && generalSnap.data()['isSystemDefault'] === true) {
          tx.update(generalRef, { isSystemDefault: false, ...audit });
        }
      }

      if (template) {
        tx.update(templateRef, {
          currentPublishedVersionId: versionId,
          active: true,
          ...(isSystemDefault ? { isSystemDefault: true } : {}),
          ...audit,
        });
      } else {
        tx.set(templateRef, {
          name: manifest.name,
          description: manifest.description,
          treatmentIds: [],
          currentPublishedVersionId: versionId,
          draftVersionId: null,
          active: true,
          isSystemDefault,
          createdAt: serverTimestamp(),
          createdBy: uid,
          ...audit,
        });
      }
    });
  }
}
