import { Routes } from '@angular/router';
import { adminAreaGuard, tabletKioskGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/public-shell/public-shell').then((m) => m.PublicShell),
    children: [
      { path: '', loadComponent: () => import('./features/public/home/home').then((m) => m.Home), title: 'SalonFlow — Beauty, Wellness, Confidence' },
      { path: 'treatments', loadComponent: () => import('./features/public/treatments/treatments').then((m) => m.Treatments), title: 'Treatments — SalonFlow' },
      { path: 'treatments/:id', loadComponent: () => import('./features/public/treatment-detail/treatment-detail').then((m) => m.TreatmentDetail), title: 'Treatment — SalonFlow' },
      { path: 'specials', loadComponent: () => import('./features/public/specials/specials').then((m) => m.Specials), title: 'Specials — SalonFlow' },
      { path: 'therapists', loadComponent: () => import('./features/public/therapists/therapists').then((m) => m.Therapists), title: 'Our Team — SalonFlow' },
      { path: 'therapists/:id', loadComponent: () => import('./features/public/therapist-detail/therapist-detail').then((m) => m.TherapistDetail), title: 'Therapist — SalonFlow' },
      { path: 'contact', loadComponent: () => import('./features/public/contact/contact').then((m) => m.Contact), title: 'Visit Us — SalonFlow' },
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    title: 'Sign in — SalonFlow',
  },
  {
    path: 'therapist',
    canActivate: [tabletKioskGuard],
    loadComponent: () => import('./layout/therapist-shell/therapist-shell').then((m) => m.TherapistShell),
    children: [
      { path: '', loadComponent: () => import('./features/therapist/dashboard/dashboard').then((m) => m.Dashboard), title: 'Today — SalonFlow' },
      { path: 'consent-forms', loadComponent: () => import('./features/therapist/consultations/consultations').then((m) => m.Consultations), title: 'Consent Forms — SalonFlow' },
      { path: 'consent-forms/new', loadComponent: () => import('./features/therapist/consultation-wizard/consultation-wizard').then((m) => m.ConsultationWizard), title: 'New Consent Form — SalonFlow' },
      { path: 'consent-forms/:id/complete', loadComponent: () => import('./features/therapist/consent-form-complete/consent-form-complete').then((m) => m.ConsentFormComplete), title: 'Complete Consent Form — SalonFlow' },
      { path: 'clients', loadComponent: () => import('./features/therapist/clients/clients').then((m) => m.Clients), title: 'Clients — SalonFlow' },
      { path: 'clients/:id', loadComponent: () => import('./features/therapist/client-detail/client-detail').then((m) => m.ClientDetail), title: 'Client — SalonFlow' },
      { path: 'menu', loadComponent: () => import('./features/therapist/treatment-menu/treatment-menu').then((m) => m.TreatmentMenu), title: 'Menu — SalonFlow' },
      { path: 'consultations', redirectTo: 'consent-forms', pathMatch: 'full' },
      { path: 'consultations/new', redirectTo: 'consent-forms/new', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminAreaGuard],
    loadComponent: () => import('./layout/admin-shell/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', loadComponent: () => import('./features/admin/dashboard/dashboard').then((m) => m.Dashboard), title: 'Admin — SalonFlow' },
      { path: 'treatments', loadComponent: () => import('./features/admin/treatments/treatments').then((m) => m.Treatments), title: 'Treatments — Admin' },
      { path: 'categories', loadComponent: () => import('./features/admin/categories/categories').then((m) => m.Categories), title: 'Categories — Admin' },
      { path: 'therapists', loadComponent: () => import('./features/admin/therapists/therapists').then((m) => m.Therapists), title: 'Therapists — Admin' },
      { path: 'specials', loadComponent: () => import('./features/admin/specials/specials').then((m) => m.Specials), title: 'Specials — Admin' },
      { path: 'consent-forms', loadComponent: () => import('./features/admin/consent-forms/consent-forms').then((m) => m.ConsentForms), title: 'Consent Forms — Admin' },
      { path: 'consultations', loadComponent: () => import('./features/admin/consultations/consultations').then((m) => m.Consultations), title: 'Consultations — Admin' },
      { path: 'clients', loadComponent: () => import('./features/admin/clients/clients').then((m) => m.Clients), title: 'Clients — Admin' },
      { path: 'clients/:id', loadComponent: () => import('./features/admin/client-detail/client-detail').then((m) => m.AdminClientDetail), title: 'Client — Admin' },
      { path: 'analytics', loadComponent: () => import('./features/admin/analytics/analytics').then((m) => m.Analytics), title: 'Analytics — Admin' },
      { path: 'settings', loadComponent: () => import('./features/admin/settings/settings').then((m) => m.Settings), title: 'Salon Details — Admin' },
      { path: 'branding', loadComponent: () => import('./features/admin/branding/branding').then((m) => m.Branding), title: 'Branding — Admin' },
      { path: 'qr-codes', loadComponent: () => import('./features/admin/qr-codes/qr-codes').then((m) => m.QrCodes), title: 'QR Codes — Admin' },
      { path: 'notifications', loadComponent: () => import('./features/admin/notifications/notifications').then((m) => m.Notifications), title: 'Notifications — Admin' },
      { path: 'users', loadComponent: () => import('./features/admin/users/users').then((m) => m.Users), title: 'Users — Admin' },
    ],
  },
  { path: '**', loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound), title: 'Not found — SalonFlow' },
];
