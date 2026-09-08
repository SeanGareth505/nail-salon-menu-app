// One-time / re-runnable demo data seed.
//
// Usage:
//   ADMIN_EMAIL=you@salon.com ADMIN_PASSWORD=your-password node scripts/seed.mjs
//
// Prerequisites (see README "First-time setup"):
//   1. firebase deploy --only firestore:rules,firestore:indexes,storage
//   2. Create your admin in Firebase Console → Authentication → Add user
//      (any Firebase Auth user is an admin — no Firestore users doc required)
//   3. Optionally create demo therapists and set tablet PINs in Admin › Therapists
//
// This script signs in as that admin (client SDK — there is no Admin SDK
// service account in this project yet) and writes catalogue + demo data
// respecting firestore.rules exactly as the deployed app would.

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { demoMeta } from './demo-catalogue.mjs';

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
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars (your Firebase Auth admin account).');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const now = () => serverTimestamp();
const aud = (uid) => ({ createdAt: now(), createdBy: uid, updatedAt: now(), updatedBy: uid });

async function main() {
  const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  const uid = cred.user.uid;
  console.log('Signed in as', ADMIN_EMAIL);

  await setDoc(doc(db, 'salonSettings/default'), {
    id: 'default',
    name: 'SalonFlow',
    tagline: 'Your escape, our passion',
    subtext: 'Beauty · Wellness · Confidence',
    addressLine1: 'Shop 42, The Zone @ Rosebank',
    addressLine2: 'Oxford Road',
    city: 'Johannesburg',
    phone: '+27 11 123 4567',
    whatsapp: '27821234567',
    email: 'hello@salonflow.co.za',
    mapLat: -26.1456,
    mapLng: 28.0436,
    locationNote: 'Parking on level P2, lift access to the first floor',
    hours: [
      { day: 'monday', label: 'Monday – Friday', open: '09:00', close: '18:00' },
      { day: 'saturday', label: 'Saturday', open: '09:00', close: '16:00' },
      { day: 'sunday', label: 'Sunday', open: '10:00', close: '14:00' },
      { day: 'public_holiday', label: 'Public holidays', open: null, close: null, byAppointmentOnly: true },
    ],
    vatIncluded: true,
    catalogueSource: 'demo',
    defaultConsentTemplateId: 'health-safety',
  });

  await setDoc(doc(db, 'branding/default'), {
    id: 'default',
    primary: '#4a6b57',
    secondary: '#8baa8e',
    accent: '#c9a96e',
    background: '#e9e6e0',
    surface: '#fffdf9',
    text: '#333333',
    logoUrl: '/assets/salonflow-logo.png',
    ...demoMeta(),
  });

  const categories = [
    { id: 'nails', name: 'Nails', slug: 'nails', icon: 'brush', tint: 'blush', sortOrder: 1 },
    { id: 'facials', name: 'Facials', slug: 'facials', icon: 'face_retouching_natural', tint: 'sage', sortOrder: 2 },
    { id: 'massage', name: 'Massage', slug: 'massage', icon: 'self_improvement', tint: 'sky', sortOrder: 3 },
    { id: 'waxing', name: 'Waxing', slug: 'waxing', icon: 'content_cut', tint: 'sand', sortOrder: 4 },
  ];
  for (const c of categories) {
    await setDoc(doc(db, 'categories', c.id), { ...c, active: true, ...demoMeta(), ...aud(uid) });
  }
  console.log('Seeded categories');

  const therapists = [
    {
      id: 'lerato', name: 'Lerato Mokoena', slug: 'lerato-mokoena', role: 'Senior Therapist',
      bio: 'Lerato has spent nine years reading skin. She is the person to see when nothing has worked — expect a slow, thorough consultation before anything touches your face.',
      experienceYears: 9, qualification: 'CIDESCO', expertise: ['Facials', 'Advanced Skincare', 'Waxing', 'Peels'],
      initial: 'L', tint: 'sage', sortOrder: 1,
    },
    {
      id: 'anja', name: 'Anja van Wyk', slug: 'anja-van-wyk', role: 'Nail Technician',
      bio: 'Anja trained in Cape Town and has been shaping, painting and repairing nails for six years. Precise, unhurried acrylic and gel work is her signature.',
      experienceYears: 6, qualification: 'SAAHSP Nail Technology', expertise: ['Gel', 'Acrylic', 'Nail Art'],
      initial: 'A', tint: 'blush', sortOrder: 2,
    },
    {
      id: 'thandi', name: 'Thandi Nkosi', slug: 'thandi-nkosi', role: 'Massage Therapist',
      bio: 'Thandi reads tension the way others read a room. Swedish, deep tissue and hot stone are all in her toolkit, tailored to what your body needs that day.',
      experienceYears: 7, qualification: 'Sorbet Academy', expertise: ['Swedish', 'Deep Tissue', 'Hot Stone'],
      initial: 'T', tint: 'sky', sortOrder: 3,
    },
    {
      id: 'zanele', name: 'Zanele Khumalo', slug: 'zanele-khumalo', role: 'Lash & Brow Specialist',
      bio: 'Zanele shapes brows and builds lash sets that hold up to real life. Ask her for the honest opinion, not just the flattering one.',
      experienceYears: 4, qualification: 'Lash Academy SA', expertise: ['Lash Lift', 'Brow Lamination', 'Tinting'],
      initial: 'Z', tint: 'sand', sortOrder: 4,
    },
  ];
  for (const t of therapists) {
    await setDoc(doc(db, 'therapists', t.id), { ...t, userId: null, pinEnabled: false, active: true, ...demoMeta(), ...aud(uid) });
  }
  console.log('Seeded therapists');

  const treatments = [
    { id: 'gel-manicure', name: 'Gel Manicure', categoryId: 'nails', categoryName: 'Nails', durationMinutes: 60, price: 350,
      shortDescription: 'Soak-off gel, cuticle work and a colour of your choosing.',
      description: 'Soak-off gel, cuticle work and a colour of your choosing. Your therapist will talk through shape, colour and aftercare before starting, and a short consultation form is completed in salon so we have your health details on record.',
      performedByTherapistIds: ['anja'], beforeAppointment: ['Arrive with clean, product-free nails where possible.', 'Let us know about any allergies or recent skin treatments.', 'A short consultation form is completed in salon before we begin.'] },
    { id: 'gel-pedicure', name: 'Gel Pedicure', categoryId: 'nails', categoryName: 'Nails', durationMinutes: 60, price: 420,
      shortDescription: 'Foot soak, shaping and long-wear gel colour.',
      description: 'Foot soak, shaping and long-wear gel colour, finished with a light callus treatment.',
      performedByTherapistIds: ['anja'], beforeAppointment: ['Avoid shaving legs the day of your appointment.'] },
    { id: 'acrylic-full-set', name: 'Acrylic Full Set', categoryId: 'nails', categoryName: 'Nails', durationMinutes: 90, price: 550,
      shortDescription: 'Sculpted extensions built to your preferred length and shape.',
      description: 'Sculpted acrylic extensions built to your preferred length and shape, finished with gel colour.',
      performedByTherapistIds: ['anja'], beforeAppointment: [] },
    { id: 'acrylic-fill', name: 'Acrylic Fill', categoryId: 'nails', categoryName: 'Nails', durationMinutes: 75, price: 400,
      shortDescription: 'Maintenance fill for existing acrylic extensions.',
      description: 'A maintenance fill to keep existing acrylic extensions neat as your natural nail grows out.',
      performedByTherapistIds: ['anja'], beforeAppointment: [] },
    { id: 'hydrating-facial', name: 'Hydrating Facial', categoryId: 'facials', categoryName: 'Facials', durationMinutes: 75, price: 780,
      shortDescription: 'Deep hydration with LED light therapy.',
      description: 'A restorative facial pairing deep hydration with LED light therapy — 75 minutes of layered calm for tired, dry skin.',
      performedByTherapistIds: ['lerato'], beforeAppointment: ['Come in with a clean face where possible.', 'Let us know about any active skin treatments (retinoids, peels) in the last week.'] },
    { id: 'full-body-swedish', name: 'Full Body Swedish', categoryId: 'massage', categoryName: 'Massage', durationMinutes: 60, price: 690,
      shortDescription: 'Long, even strokes to settle the whole nervous system.',
      description: 'Long, even strokes to settle the whole nervous system — a classic full-body relaxation massage.',
      performedByTherapistIds: ['thandi'], beforeAppointment: [] },
    { id: 'aromatherapy-massage', name: 'Aromatherapy Massage', categoryId: 'massage', categoryName: 'Massage', durationMinutes: 75, price: 790,
      shortDescription: 'Blended essential oils chosen with you on the day.',
      description: 'Blended essential oils chosen with you on the day, worked in with a full-body massage.',
      performedByTherapistIds: ['thandi'], beforeAppointment: ['Let us know about any pregnancy or allergies before we blend oils.'] },
    { id: 'hot-stone-massage', name: 'Hot Stone Massage', categoryId: 'massage', categoryName: 'Massage', durationMinutes: 90, price: 950,
      shortDescription: 'Warmed basalt stones for deep muscular release.',
      description: 'Warmed basalt stones for deep muscular release across a full 90-minute session.',
      performedByTherapistIds: ['thandi'], beforeAppointment: [] },
    { id: 'half-leg-wax', name: 'Half Leg', categoryId: 'waxing', categoryName: 'Waxing', durationMinutes: 30, price: 280,
      shortDescription: 'Knee down, warm wax.',
      description: 'Knee down, warm wax hair removal.',
      performedByTherapistIds: ['lerato'], beforeAppointment: ['Hair should be at least 5mm long.', 'Avoid retinoid or exfoliating products on the area for 48 hours before.'] },
    { id: 'full-leg-wax', name: 'Full Leg', categoryId: 'waxing', categoryName: 'Waxing', durationMinutes: 45, price: 420,
      shortDescription: 'Ankle to upper thigh.',
      description: 'Ankle to upper thigh, warm wax hair removal.',
      performedByTherapistIds: ['lerato'], beforeAppointment: ['Hair should be at least 5mm long.', 'Avoid retinoid or exfoliating products on the area for 48 hours before.'] },
  ];
  for (const t of treatments) {
    await setDoc(doc(db, 'treatments', t.id), {
      ...t, slug: t.id, onSpecial: false, specialId: null, relatedTreatmentIds: [],
      featured: ['gel-manicure', 'hydrating-facial', 'aromatherapy-massage'].includes(t.id),
      imageUrl: null,
      consentTemplateId: 'health-safety', active: true, sortOrder: 1, ...demoMeta(), ...aud(uid),
    });
  }
  console.log('Seeded treatments');

  const specials = [
    {
      id: 'winter-glow',
      kind: 'single',
      title: 'Winter Glow Facial Ritual',
      scriptTitle: 'Winter Glow',
      treatmentIds: ['hydrating-facial'],
      discountType: 'fixed',
      description: 'Hydrating Facial paired with LED light therapy — 75 minutes of layered hydration and calm.',
      price: 650,
      originalPrice: 780,
      startsAt: '2026-08-01',
      endsAt: '2026-09-30',
      therapistIds: ['lerato'],
      finePrint: 'One per client. Cannot be combined with other offers.',
      isDraft: false,
      sortOrder: 1,
      featured: true,
    },
    {
      id: 'gel-mani-pedi-duo',
      kind: 'bundle',
      title: 'Gel Mani + Pedi Duo',
      scriptTitle: 'Gel Mani + Pedi Duo',
      treatmentIds: ['gel-manicure', 'gel-pedicure'],
      discountType: 'fixed',
      description: 'A gel manicure and gel pedicure together in one relaxed appointment.',
      price: 650,
      originalPrice: 770,
      startsAt: '2026-08-01',
      endsAt: '2026-09-30',
      therapistIds: ['anja'],
      finePrint: 'One per client. Cannot be combined with other offers.',
      isDraft: false,
      sortOrder: 2,
      featured: false,
    },
    {
      id: 'spring-refresh',
      kind: 'single',
      title: 'Spring Refresh Massage',
      scriptTitle: 'Spring Refresh',
      treatmentIds: ['full-body-swedish'],
      discountType: 'percent',
      percentOff: 15,
      description: '15% off a full body Swedish massage — book ahead for our spring launch.',
      price: 587,
      originalPrice: 690,
      startsAt: '2026-09-12',
      endsAt: '2026-09-30',
      therapistIds: ['thandi'],
      finePrint: 'Valid for one booking per client during the promotional period.',
      isDraft: false,
      sortOrder: 3,
      featured: false,
    },
  ];
  for (const s of specials) {
    await setDoc(doc(db, 'specials', s.id), { ...s, ...demoMeta(), ...aud(uid) });
  }
  console.log('Seeded specials');

  const liveSpecialTreatmentMap = {
    'hydrating-facial': 'winter-glow',
    'gel-manicure': 'gel-mani-pedi-duo',
    'gel-pedicure': 'gel-mani-pedi-duo',
  };
  for (const t of treatments) {
    const specialId = liveSpecialTreatmentMap[t.id] ?? null;
    await updateDoc(doc(db, 'treatments', t.id), {
      onSpecial: !!specialId,
      specialId,
      updatedAt: now(),
      updatedBy: uid,
    });
  }
  console.log('Synced treatment special flags');

  // Consent architecture: one template covering the general health & safety
  // + treatment questions used across the demo treatments, published as v1.
  await setDoc(doc(db, 'consentTemplates/health-safety'), {
    name: 'General Health & Safety',
    description: 'Standard pre-treatment health & safety consent, used across most treatments.',
    treatmentIds: treatments.map((t) => t.id),
    currentPublishedVersionId: 'health-safety-v1',
    draftVersionId: null,
    active: true,
    ...demoMeta(),
    ...aud(uid),
  });

  await setDoc(doc(db, 'consentTemplateVersions/health-safety-v1'), {
    templateId: 'health-safety',
    versionNumber: 1,
    status: 'published',
    publishedAt: new Date().toISOString(),
    publishedBy: uid,
    steps: [
      { key: 'details', title: 'Your details', sortOrder: 1 },
      { key: 'health_safety', title: 'Health & safety', sortOrder: 2 },
      { key: 'treatment_questions', title: 'Treatment questions', sortOrder: 3 },
    ],
    fields: [
      { key: 'full_name', type: 'text', label: 'Full name', required: true, step: 'details', sortOrder: 1 },
      { key: 'phone', type: 'phone', label: 'Phone number', required: true, step: 'details', sortOrder: 2 },
      { key: 'email', type: 'email', label: 'Email (optional)', required: false, step: 'details', sortOrder: 3 },
      { key: 'allergies', type: 'yes_no_unsure', label: 'Do you have any known allergies?', required: true, step: 'health_safety', sortOrder: 1 },
      { key: 'allergies_detail', type: 'text', label: 'Please list your allergies', required: true, step: 'health_safety', sortOrder: 2,
        conditions: [{ dependsOn: 'allergies', operator: 'one_of', value: ['yes', 'unsure'] }] },
      { key: 'medication', type: 'yes_no', label: 'Are you currently taking any medication?', required: true, step: 'health_safety', sortOrder: 3 },
      { key: 'retinoid_use', type: 'yes_no_unsure', label: 'Have you used retinol or a retinoid in the last 7 days?', required: true, step: 'health_safety', sortOrder: 4 },
      { key: 'retinoid_warning', type: 'warning', label: 'Therapist review required', bodyText: 'Waxing over retinoid-treated skin risks lifting. Your therapist must review this before treatment can proceed.', required: false, step: 'health_safety', sortOrder: 5,
        conditions: [{ dependsOn: 'retinoid_use', operator: 'one_of', value: ['yes', 'unsure'] }] },
      { key: 'pregnant_breastfeeding', type: 'yes_no', label: 'Are you pregnant or breastfeeding?', required: true, step: 'health_safety', sortOrder: 6 },
      { key: 'skin_condition', type: 'yes_no', label: 'Do you currently have any rash, infection, inflammation or broken skin in the treatment area?', required: true, step: 'health_safety', sortOrder: 7 },
      { key: 'aftercare_ack', type: 'acknowledgement', label: 'Aftercare acknowledgement', bodyText: 'I understand and will follow the aftercare advice given by my therapist.', required: true, step: 'treatment_questions', sortOrder: 1 },
    ],
    ...demoMeta(),
    ...aud(uid),
  });
  console.log('Seeded consent template + published v1');

  console.log('\nDone. Demo catalogue is ready — clear it from Admin › Salon details when you want to start from scratch.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
