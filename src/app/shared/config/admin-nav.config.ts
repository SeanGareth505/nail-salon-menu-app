export interface AdminNavItem {
  path: string;
  label: string;
  shortLabel: string;
  icon: string;
  exact: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { path: '/admin', label: 'Dashboard', shortLabel: 'Home', icon: 'grid', exact: true },
  { path: '/admin/consultations', label: 'Consent forms', shortLabel: 'Forms', icon: 'clipboard', exact: false },
  { path: '/admin/consent-forms', label: 'Consent forms', shortLabel: 'Forms', icon: 'doccheck', exact: false },
  { path: '/admin/clients', label: 'Clients', shortLabel: 'Clients', icon: 'clients', exact: false },
  { path: '/admin/treatments', label: 'Treatments', shortLabel: 'Menu', icon: 'leaf', exact: false },
  { path: '/admin/categories', label: 'Categories', shortLabel: 'Cats', icon: 'folder', exact: false },
  { path: '/admin/therapists', label: 'Therapists', shortLabel: 'Team', icon: 'user', exact: false },
  { path: '/admin/specials', label: 'Specials', shortLabel: 'Specials', icon: 'specials', exact: false },
  { path: '/admin/settings', label: 'Salon details', shortLabel: 'Salon', icon: 'building', exact: false },
  { path: '/admin/branding', label: 'Branding', shortLabel: 'Brand', icon: 'droplet', exact: false },
  { path: '/admin/qr-codes', label: 'QR codes', shortLabel: 'QR', icon: 'qr', exact: false },
  { path: '/admin/analytics', label: 'Analytics', shortLabel: 'Stats', icon: 'chart', exact: false },
  { path: '/admin/notifications', label: 'Notifications', shortLabel: 'Alerts', icon: 'bell', exact: false },
  { path: '/admin/users', label: 'Users', shortLabel: 'Users', icon: 'shield', exact: false },
];

export const ADMIN_PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/consultations': 'Consent forms',
  '/admin/consent-forms': 'Consent forms',
  '/admin/clients': 'Clients',
  '/admin/treatments': 'Treatments',
  '/admin/categories': 'Categories',
  '/admin/therapists': 'Therapists',
  '/admin/specials': 'Specials',
  '/admin/settings': 'Salon details',
  '/admin/branding': 'Branding',
  '/admin/qr-codes': 'QR codes',
  '/admin/analytics': 'Analytics',
  '/admin/notifications': 'Notifications',
  '/admin/users': 'Users',
};

export const ADMIN_PAGE_ACTIONS: Record<string, string> = {
  '/admin': 'Export',
  '/admin/consultations': 'Export',
  '/admin/consent-forms': 'New form',
  '/admin/clients': 'Add client',
  '/admin/treatments': 'New treatment',
  '/admin/categories': 'New category',
  '/admin/therapists': 'Add therapist',
  '/admin/specials': 'New special',
  '/admin/settings': 'Save',
  '/admin/branding': 'Save theme',
  '/admin/qr-codes': 'New QR code',
  '/admin/analytics': 'Export',
  '/admin/notifications': 'Save',
  '/admin/users': 'Invite user',
};

export function adminTitleForUrl(url: string): string {
  const base = url.split('?')[0];
  if (ADMIN_PAGE_TITLES[base]) return ADMIN_PAGE_TITLES[base];
  if (base.startsWith('/admin/clients/')) return 'Client';
  return 'Admin';
}

export function adminActionForUrl(url: string): string | null {
  const base = url.split('?')[0];
  return ADMIN_PAGE_ACTIONS[base] ?? null;
}
