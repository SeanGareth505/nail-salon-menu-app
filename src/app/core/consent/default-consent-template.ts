import manifest from '../../../assets/default-consent-template.json';
import { ConsentField, ConsentStepDefinition } from '../models';

export interface DefaultConsentTemplateManifest {
  templateId: string;
  versionId: string;
  name: string;
  description: string;
  steps: ConsentStepDefinition[];
  fields: ConsentField[];
}

export const DEFAULT_CONSENT_TEMPLATE = manifest as DefaultConsentTemplateManifest;

export const DEFAULT_CONSENT_TEMPLATE_ID = DEFAULT_CONSENT_TEMPLATE.templateId;
export const DEFAULT_CONSENT_VERSION_ID = DEFAULT_CONSENT_TEMPLATE.versionId;

export const DEFAULT_CONSENT_STEPS = DEFAULT_CONSENT_TEMPLATE.steps;
export const DEFAULT_CONSENT_FIELDS = DEFAULT_CONSENT_TEMPLATE.fields;
