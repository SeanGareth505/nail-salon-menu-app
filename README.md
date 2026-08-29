# SalonFlow

Production Angular 20 app for a nail salon and wellness menu — public client menu, therapist consultation workflow, and admin back office.

## Stack

- Angular 20 (standalone components, strict TypeScript)
- Angular Material theme tokens + custom SCSS design system
- Firebase Auth, Firestore, Storage, Hosting, App Check
- Angular PWA / service worker

## Local development

```bash
npm install --legacy-peer-deps
npm start
```

Open http://localhost:4200/

## Firebase project

Project: `salonix-66a6c`

Deploy rules and indexes first:

```bash
npm run firebase:rules
```

Build and deploy hosting:

```bash
npm run deploy
```

## Access model

- **Admins** — any Firebase Authentication email/password user. Sign in at `/login`. No Firestore `users` doc required.
- **Therapists** — salon iPad PIN at `/login/therapist`. Set a 6-digit PIN on **Admin › Therapists**.

## First-time data setup

1. Create your admin in Firebase Console → Authentication → Add user
2. Seed demo catalogue data:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=your-password npm run seed
```

## Routes

| Area | Paths |
|------|-------|
| Public | `/`, `/treatments`, `/treatments/:id`, `/specials`, `/therapists`, `/therapists/:id`, `/contact` |
| Therapist | `/therapist`, `/therapist/consultations`, `/therapist/consultations/new`, `/therapist/clients/:id` |
| Admin | `/admin`, `/admin/treatments`, `/admin/categories`, `/admin/therapists`, `/admin/specials`, `/admin/consent-forms`, `/admin/consultations`, `/admin/analytics`, `/admin/settings`, `/admin/branding`, `/admin/qr-codes`, `/admin/users` |

Staff sign-in: `/login` (email) · Therapist PIN: `/login/therapist`

## App Check (production)

Set `appCheckSiteKey` in `src/environments/environment.ts` before production deploy. Register debug tokens in Firebase Console for local development.

## Build

```bash
npm run build
```

Output: `dist/salonflow/browser`
