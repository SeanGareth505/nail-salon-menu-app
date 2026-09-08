import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { doc, runTransaction } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '../projects/shared/src/assets');

export const NAIL_CONSENT_TEMPLATE = JSON.parse(
  readFileSync(join(assetsDir, 'nail-consent-template.json'), 'utf8'),
);
export const GENERAL_CONSENT_TEMPLATE = JSON.parse(
  readFileSync(join(assetsDir, 'default-consent-template.json'), 'utf8'),
);
const previousGeneral = JSON.parse(
  readFileSync(join(assetsDir, 'default-consent-template-v1.json'), 'utf8'),
);

export const DEFAULT_CONSENT_TEMPLATE = NAIL_CONSENT_TEMPLATE;
export const BUILT_IN_CONSENT_TEMPLATES = [NAIL_CONSENT_TEMPLATE, GENERAL_CONSENT_TEMPLATE];

function stableValue(value) {
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

export function matchesBundledConsentVersion(version, bundled) {
  return !!version && version.templateId === bundled.templateId &&
    version.versionNumber === (bundled.versionNumber ?? 1) &&
    stableValue(version.steps) === stableValue(bundled.steps) &&
    stableValue(version.fields) === stableValue(bundled.fields);
}

async function ensureBuiltInConsentTemplate(db, uid, serverTimestamp, manifest, isSystemDefault) {
  const { templateId, versionId, name, description, steps, fields } = manifest;
  const versionNumber = manifest.versionNumber ?? 1;
  const templateRef = doc(db, `consentTemplates/${templateId}`);
  const versionRef = doc(db, `consentTemplateVersions/${versionId}`);
  await runTransaction(db, async (tx) => {
    const templateSnap = await tx.get(templateRef);
    const template = templateSnap.exists() ? templateSnap.data() : undefined;
    const currentId = template?.currentPublishedVersionId;
    const currentSnap = currentId
      ? await tx.get(doc(db, `consentTemplateVersions/${currentId}`))
      : undefined;
    const current = currentSnap?.exists() ? currentSnap.data() : undefined;
    const upgrade = templateId === GENERAL_CONSENT_TEMPLATE.templateId &&
      template?.active !== false &&
      !template?.draftVersionId &&
      currentId === previousGeneral.versionId &&
      current?.status === 'published' &&
      current.versionNumber < versionNumber &&
      matchesBundledConsentVersion(current, previousGeneral);
    const audit = { updatedAt: serverTimestamp(), updatedBy: uid };

    if (template && !upgrade && (currentId || template.draftVersionId)) {
      const patch = {};
      if (currentId && template.active !== true) {
        patch.active = true;
      }
      if (
        isSystemDefault &&
        template.isSystemDefault !== true &&
        !template.draftVersionId
      ) {
        const generalRef = doc(db, `consentTemplates/${GENERAL_CONSENT_TEMPLATE.templateId}`);
        const generalSnap = await tx.get(generalRef);
        if (generalSnap.exists() && generalSnap.data().isSystemDefault === true) {
          tx.update(generalRef, { isSystemDefault: false, ...audit });
        }
        patch.isSystemDefault = true;
      }
      if (Object.keys(patch).length) {
        tx.update(templateRef, { ...patch, ...audit });
      }
      return;
    }

    const versionSnap = await tx.get(versionRef);
    if (versionSnap.exists() && (versionSnap.data().status !== 'published' ||
      !matchesBundledConsentVersion(versionSnap.data(), manifest))) {
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
        publishedAt: new Date().toISOString(),
        publishedBy: uid,
        steps,
        fields,
        createdAt: serverTimestamp(),
        createdBy: uid,
        ...audit,
      });
    }
    if (upgrade) {
      tx.update(doc(db, `consentTemplateVersions/${currentId}`), {
        status: 'archived', ...audit,
      });
    }
    if (isSystemDefault) {
      const generalRef = doc(db, `consentTemplates/${GENERAL_CONSENT_TEMPLATE.templateId}`);
      const generalSnap = await tx.get(generalRef);
      if (generalSnap.exists() && generalSnap.data().isSystemDefault === true) {
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
        name,
        description,
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

export async function ensureDefaultConsentTemplate(db, uid, serverTimestamp) {
  await ensureBuiltInConsentTemplate(db, uid, serverTimestamp, NAIL_CONSENT_TEMPLATE, true);
  await ensureBuiltInConsentTemplate(db, uid, serverTimestamp, GENERAL_CONSENT_TEMPLATE, false);
}
