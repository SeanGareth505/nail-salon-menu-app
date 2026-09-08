import { inject, Injectable } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import {
  DEFAULT_CONSENT_TEMPLATE,
  DEFAULT_CONSENT_TEMPLATE_ID,
  DEFAULT_CONSENT_VERSION_ID,
} from '../consent/default-consent-template';
import { ConsentTemplatesService } from './consent-templates.service';
import { ConsentTemplateVersionsService } from './consent-template-versions.service';

@Injectable({ providedIn: 'root' })
export class DefaultConsentTemplateService {
  private readonly firestore = inject(Firestore);
  private readonly templatesSvc = inject(ConsentTemplatesService);
  private readonly versionsSvc = inject(ConsentTemplateVersionsService);
  private ensurePromise: Promise<string> | null = null;

  async ensureDefaultTemplate(): Promise<string> {
    if (!this.ensurePromise) {
      this.ensurePromise = this.doEnsure();
    }
    return this.ensurePromise;
  }

  private async doEnsure(): Promise<string> {
    const templateRef = doc(this.firestore, `consentTemplates/${DEFAULT_CONSENT_TEMPLATE_ID}`);
    const versionRef = doc(this.firestore, `consentTemplateVersions/${DEFAULT_CONSENT_VERSION_ID}`);
    const templateSnap = await getDoc(templateRef);

    if (templateSnap.exists()) {
      const data = templateSnap.data();
      if (data['currentPublishedVersionId'] && data['active'] !== false) {
        return DEFAULT_CONSENT_TEMPLATE_ID;
      }
      await this.templatesSvc.update(DEFAULT_CONSENT_TEMPLATE_ID, {
        active: true,
        currentPublishedVersionId: data['currentPublishedVersionId'] ?? DEFAULT_CONSENT_VERSION_ID,
        isSystemDefault: true,
      } as any);
      return DEFAULT_CONSENT_TEMPLATE_ID;
    }

    const versionSnap = await getDoc(versionRef);
    if (!versionSnap.exists()) {
      await this.versionsSvc.createWithId(DEFAULT_CONSENT_VERSION_ID, {
        templateId: DEFAULT_CONSENT_TEMPLATE_ID,
        versionNumber: 1,
        status: 'published',
        steps: DEFAULT_CONSENT_TEMPLATE.steps,
        fields: DEFAULT_CONSENT_TEMPLATE.fields,
        publishedAt: new Date().toISOString(),
        publishedBy: null,
      } as any);
    }

    await this.templatesSvc.createWithId(DEFAULT_CONSENT_TEMPLATE_ID, {
      name: DEFAULT_CONSENT_TEMPLATE.name,
      description: DEFAULT_CONSENT_TEMPLATE.description,
      treatmentIds: [],
      currentPublishedVersionId: DEFAULT_CONSENT_VERSION_ID,
      draftVersionId: null,
      active: true,
      isSystemDefault: true,
    } as any);

    return DEFAULT_CONSENT_TEMPLATE_ID;
  }
}
