import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/public-shell/public-shell').then((m) => m.PublicShell),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
        title: 'SalonFlow — Beauty, Wellness, Confidence',
      },
      {
        path: 'treatments',
        loadComponent: () =>
          import('./features/public/treatments/treatments').then((m) => m.Treatments),
        title: 'Treatments — SalonFlow',
      },
      {
        path: 'treatments/:id',
        loadComponent: () =>
          import('./features/public/treatment-detail/treatment-detail').then(
            (m) => m.TreatmentDetail,
          ),
        title: 'Treatment — SalonFlow',
      },
      {
        path: 'specials',
        loadComponent: () => import('./features/public/specials/specials').then((m) => m.Specials),
        title: 'Specials — SalonFlow',
      },
      {
        path: 'therapists',
        loadComponent: () =>
          import('./features/public/therapists/therapists').then((m) => m.Therapists),
        title: 'Our Team — SalonFlow',
      },
      {
        path: 'therapists/:id',
        loadComponent: () =>
          import('./features/public/therapist-detail/therapist-detail').then(
            (m) => m.TherapistDetail,
          ),
        title: 'Therapist — SalonFlow',
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/public/contact/contact').then((m) => m.Contact),
        title: 'Visit Us — SalonFlow',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
    title: 'Not found — SalonFlow',
  },
];
