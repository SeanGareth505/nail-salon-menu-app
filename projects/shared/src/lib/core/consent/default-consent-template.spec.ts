import {
  DEFAULT_CONSENT_TEMPLATE,
  DEFAULT_CONSENT_TEMPLATE_ID,
  DEFAULT_CONSENT_VERSION_ID,
  GENERAL_CONSENT_TEMPLATE,
  GENERAL_CONSENT_TEMPLATE_ID,
  GENERAL_CONSENT_VERSION_ID,
  GENERAL_CONSENT_VERSION_NUMBER,
  NAIL_CONSENT_TEMPLATE,
  PREVIOUS_GENERAL_CONSENT_TEMPLATE,
  canUpgradeBuiltInConsentTemplate,
  isBundledConsentVersion,
  isBuiltInConsentTemplateId,
  resolveBundledConsentVersion,
} from './default-consent-template';
import { ConsentTemplate } from '../models';

describe('Built-in consent version adoption', () => {
  const previousId = PREVIOUS_GENERAL_CONSENT_TEMPLATE.versionId;
  const template: Partial<ConsentTemplate> = {
    id: GENERAL_CONSENT_TEMPLATE_ID,
    isSystemDefault: false,
    active: true,
    draftVersionId: null,
    currentPublishedVersionId: previousId,
  };

  it('uses the nail form as the salon default', () => {
    expect(DEFAULT_CONSENT_TEMPLATE_ID).toBe(NAIL_CONSENT_TEMPLATE.templateId);
    expect(DEFAULT_CONSENT_VERSION_ID).toBe(NAIL_CONSENT_TEMPLATE.versionId);
    expect(isBuiltInConsentTemplateId(NAIL_CONSENT_TEMPLATE.templateId)).toBeTrue();
    expect(isBuiltInConsentTemplateId(GENERAL_CONSENT_TEMPLATE_ID)).toBeTrue();
  });

  it('adopts the new general version only for the unchanged published form', () => {
    const previous = resolveBundledConsentVersion(previousId)!;
    expect(canUpgradeBuiltInConsentTemplate(template, previous)).toBeTrue();
    expect(GENERAL_CONSENT_VERSION_NUMBER).toBeGreaterThan(previous.versionNumber);
  });

  it('preserves locally customised published wording', () => {
    const previous = resolveBundledConsentVersion(previousId)!;
    previous.fields[0].label = 'Our custom wording';
    expect(canUpgradeBuiltInConsentTemplate(template, previous)).toBeFalse();
  });

  it('preserves custom drafts, disabled forms, and non-general templates', () => {
    const previous = resolveBundledConsentVersion(previousId)!;
    expect(canUpgradeBuiltInConsentTemplate({ ...template, draftVersionId: 'custom-draft' }, previous)).toBeFalse();
    expect(canUpgradeBuiltInConsentTemplate({ ...template, active: false }, previous)).toBeFalse();
    expect(canUpgradeBuiltInConsentTemplate({ ...template, id: 'custom-template' }, previous)).toBeFalse();
    expect(canUpgradeBuiltInConsentTemplate({
      ...template,
      id: DEFAULT_CONSENT_TEMPLATE_ID,
      currentPublishedVersionId: DEFAULT_CONSENT_VERSION_ID,
    }, resolveBundledConsentVersion(DEFAULT_CONSENT_VERSION_ID)!)).toBeFalse();
  });

  it('preserves a published custom version even when the template id matches', () => {
    const previous = resolveBundledConsentVersion(previousId)!;
    expect(canUpgradeBuiltInConsentTemplate({ ...template, currentPublishedVersionId: 'custom-v2' }, {
      ...previous, id: 'custom-v2', versionNumber: 2,
    })).toBeFalse();
  });

  it('resolves historical and nail built-in wording independently', () => {
    const previous = resolveBundledConsentVersion(previousId)!;
    expect(previous.fields).toEqual(PREVIOUS_GENERAL_CONSENT_TEMPLATE.fields);
    expect(previous.versionNumber).toBe(1);
    expect(previous.id).not.toBe(GENERAL_CONSENT_VERSION_ID);
    expect(resolveBundledConsentVersion(GENERAL_CONSENT_VERSION_ID)?.fields).toEqual(GENERAL_CONSENT_TEMPLATE.fields);
    expect(resolveBundledConsentVersion(DEFAULT_CONSENT_VERSION_ID)?.fields).toEqual(DEFAULT_CONSENT_TEMPLATE.fields);
    expect(resolveBundledConsentVersion('unknown-custom-version')).toBeUndefined();
  });

  it('compares Firestore field maps without relying on property order', () => {
    const previous = resolveBundledConsentVersion(previousId)!;
    previous.fields = previous.fields.map((field) => Object.fromEntries(
      Object.entries(field).reverse(),
    ) as typeof field);
    expect(isBundledConsentVersion(previous)).toBeTrue();
  });

  it('does not share editable field arrays with the immutable bundled history', () => {
    const previous = resolveBundledConsentVersion(previousId)!;
    previous.fields.splice(0, 1);
    expect(resolveBundledConsentVersion(previousId)?.fields.length).toBe(PREVIOUS_GENERAL_CONSENT_TEMPLATE.fields.length);
  });

  it('does not treat a mismatching version number as the shipped template', () => {
    const previous = resolveBundledConsentVersion(previousId)!;
    previous.versionNumber = 9;
    expect(isBundledConsentVersion(previous)).toBeFalse();
  });
});
