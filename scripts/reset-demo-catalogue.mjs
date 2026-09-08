import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, deleteDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { demoMeta } from './demo-catalogue.mjs';
import { DEFAULT_CONSENT_TEMPLATE, ensureDefaultConsentTemplate } from './default-consent-template.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, '../src/assets/demo-catalogue.manifest.json'), 'utf8'));

const firebaseConfig = {
  apiKey: 'AIzaSyD7oAK5uqxY6xueecZbp4AZiupp3ZT9-3w',
  authDomain: 'salonix-66a6c.firebaseapp.com',
  projectId: 'salonix-66a6c',
  storageBucket: 'salonix-66a6c.firebasestorage.app',
  messagingSenderId: '220871461623',
  appId: '1:220871461623:web:3d0f01b038b3ba0b1ca1f2',
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const blankSettings = {
  id: 'default',
  name: '',
  tagline: '',
  subtext: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  phone: '',
  whatsapp: '',
  email: '',
  hours: [
    { day: 'monday', label: 'Monday – Friday', open: '09:00', close: '18:00' },
    { day: 'saturday', label: 'Saturday', open: '09:00', close: '16:00' },
    { day: 'sunday', label: 'Sunday', open: null, close: null },
    { day: 'public_holiday', label: 'Public holidays', open: null, close: null, byAppointmentOnly: true },
  ],
  vatIncluded: true,
  catalogueSource: 'custom',
  defaultConsentTemplateId: DEFAULT_CONSENT_TEMPLATE.templateId,
};

const starterBranding = {
  id: 'default',
  primary: '#4a6b57',
  secondary: '#8baa8e',
  accent: '#c9a96e',
  background: '#e9e6e0',
  surface: '#fffdf9',
  text: '#333333',
  logoUrl: '/assets/salonflow-logo.png',
  markInitial: 'SF',
};

async function main() {
  const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  const uid = cred.user.uid;
  const aud = () => ({ updatedAt: serverTimestamp(), updatedBy: uid });
  console.log('Signed in as', ADMIN_EMAIL);

  for (const id of manifest.categories) await deleteDoc(doc(db, 'categories', id));
  for (const id of manifest.therapists) await deleteDoc(doc(db, 'therapists', id));
  for (const id of manifest.treatments) await deleteDoc(doc(db, 'treatments', id));
  for (const id of manifest.specials) await deleteDoc(doc(db, 'specials', id));

  for (const id of manifest.consentTemplates) {
    await updateDoc(doc(db, 'consentTemplates', id), { active: false, seedSource: demoMeta().seedSource });
  }

  await setDoc(doc(db, 'salonSettings/default'), {
    ...blankSettings,
    ...aud(),
  }, { merge: true });

  await setDoc(doc(db, 'branding/default'), {
    ...starterBranding,
    ...aud(),
  }, { merge: true });

  await ensureDefaultConsentTemplate(db, uid, serverTimestamp);

  console.log('Demo catalogue cleared. Salon details and branding reset — add your own content in Admin.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});
