import generalManifest from '../../../assets/default-consent-template.json';
import previousGeneralManifest from '../../../assets/default-consent-template-v1.json';
import nailManifest from '../../../assets/nail-consent-template.json';
import { ConsentField, ConsentStepDefinition, ConsentTemplate, ConsentTemplateVersion } from '../models';

export interface DefaultConsentTemplateManifest {
  templateId: string;
  versionId: string;
  versionNumber?: number;
  name: string;
  description: string;
  steps: ConsentStepDefinition[];
  fields: ConsentField[];
}

export const NAIL_CONSENT_TEMPLATE = nailManifest as DefaultConsentTemplateManifest;
export const GENERAL_CONSENT_TEMPLATE = generalManifest as DefaultConsentTemplateManifest;
export const PREVIOUS_GENERAL_CONSENT_TEMPLATE =
  previousGeneralManifest as DefaultConsentTemplateManifest;

export const DEFAULT_CONSENT_TEMPLATE = NAIL_CONSENT_TEMPLATE;
export const PREVIOUS_DEFAULT_CONSENT_TEMPLATE = PREVIOUS_GENERAL_CONSENT_TEMPLATE;
export const DEFAULT_CONSENT_TEMPLATE_ID = DEFAULT_CONSENT_TEMPLATE.templateId;
export const DEFAULT_CONSENT_VERSION_ID = DEFAULT_CONSENT_TEMPLATE.versionId;
export const DEFAULT_CONSENT_VERSION_NUMBER = DEFAULT_CONSENT_TEMPLATE.versionNumber ?? 1;
export const DEFAULT_CONSENT_STEPS = DEFAULT_CONSENT_TEMPLATE.steps;
export const DEFAULT_CONSENT_FIELDS = DEFAULT_CONSENT_TEMPLATE.fields;

export const GENERAL_CONSENT_TEMPLATE_ID = GENERAL_CONSENT_TEMPLATE.templateId;
export const GENERAL_CONSENT_VERSION_ID = GENERAL_CONSENT_TEMPLATE.versionId;
export const GENERAL_CONSENT_VERSION_NUMBER = GENERAL_CONSENT_TEMPLATE.versionNumber ?? 1;

export const BUILT_IN_CONSENT_TEMPLATES: readonly DefaultConsentTemplateManifest[] = [
  NAIL_CONSENT_TEMPLATE,
  GENERAL_CONSENT_TEMPLATE,
];

const BUNDLED_CONSENT_VERSIONS: readonly DefaultConsentTemplateManifest[] = [
  NAIL_CONSENT_TEMPLATE,
  GENERAL_CONSENT_TEMPLATE,
  PREVIOUS_GENERAL_CONSENT_TEMPLATE,
];

function stableValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableValue(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? '';
}

export function resolveBundledConsentVersion(id: string): ConsentTemplateVersion | undefined {
  const bundled = BUNDLED_CONSENT_VERSIONS.find((version) => version.versionId === id);
  if (!bundled) return undefined;
  return {
    id: bundled.versionId,
    templateId: bundled.templateId,
    versionNumber: bundled.versionNumber ?? 1,
    status: 'published',
    publishedAt: null,
    publishedBy: null,
    createdAt: null,
    createdBy: null,
    updatedAt: null,
    updatedBy: null,
    steps: structuredClone(bundled.steps),
    fields: structuredClone(bundled.fields),
  };
}

export function isBundledConsentVersion(version: ConsentTemplateVersion): boolean {
  const bundled = resolveBundledConsentVersion(version.id);
  return !!bundled && version.templateId === bundled.templateId &&
    version.versionNumber === bundled.versionNumber &&
    stableValue(version.steps) === stableValue(bundled.steps) &&
    stableValue(version.fields) === stableValue(bundled.fields);
}

export function isBuiltInConsentTemplateId(templateId: string): boolean {
  return BUILT_IN_CONSENT_TEMPLATES.some((template) => template.templateId === templateId);
}

export function canUpgradeBuiltInConsentTemplate(
  template: Partial<ConsentTemplate> | undefined,
  currentVersion: ConsentTemplateVersion | undefined,
): boolean {
  return !!template && !!currentVersion &&
    template.id === GENERAL_CONSENT_TEMPLATE_ID &&
    template.active !== false &&
    !template.draftVersionId &&
    template.currentPublishedVersionId === PREVIOUS_GENERAL_CONSENT_TEMPLATE.versionId &&
    currentVersion.id === template.currentPublishedVersionId &&
    currentVersion.versionNumber < GENERAL_CONSENT_VERSION_NUMBER &&
    currentVersion.status === 'published' &&
    isBundledConsentVersion(currentVersion);
}
