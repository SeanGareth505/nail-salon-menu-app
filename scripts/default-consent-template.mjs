import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DEFAULT_CONSENT_TEMPLATE = JSON.parse(
  readFileSync(join(__dirname, '../src/assets/default-consent-template.json'), 'utf8'),
);

export async function ensureDefaultConsentTemplate(db, uid, serverTimestamp) {
  const { templateId, versionId, name, description, steps, fields } = DEFAULT_CONSENT_TEMPLATE;
  const audit = {
    createdAt: serverTimestamp(),
    createdBy: uid,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };

  const templateRef = doc(db, `consentTemplates/${templateId}`);
  const versionRef = doc(db, `consentTemplateVersions/${versionId}`);
  const templateSnap = await getDoc(templateRef);

  if (!templateSnap.exists() || !templateSnap.data()?.currentPublishedVersionId) {
    await setDoc(versionRef, {
      templateId,
      versionNumber: 1,
      status: 'published',
      publishedAt: new Date().toISOString(),
      publishedBy: uid,
      steps,
      fields,
      ...audit,
    });

    await setDoc(templateRef, {
      name,
      description,
      treatmentIds: [],
      currentPublishedVersionId: versionId,
      draftVersionId: null,
      active: true,
      isSystemDefault: true,
      ...audit,
    });
    console.log('Provisioned default consent template');
    return;
  }

  if (templateSnap.data()?.active === false) {
    await updateDoc(templateRef, {
      active: true,
      isSystemDefault: true,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
    console.log('Reactivated default consent template');
  }
}
