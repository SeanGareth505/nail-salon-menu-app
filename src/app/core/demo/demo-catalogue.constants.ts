import manifest from '../../../assets/demo-catalogue.manifest.json';
import { BrandingTokens } from '../models';
import { SalonHours, SalonSettings } from '../models/salon-settings.model';
import { DEFAULT_CONSENT_TEMPLATE_ID } from '../consent/default-consent-template';

import { DEFAULT_MARK_INITIAL } from '../services/salon-identity.service';

export const DEMO_SEED_SOURCE = manifest.seedSource;
export const DEMO_CATALOGUE_IDS = manifest;

export const BLANK_SALON_HOURS: SalonHours[] = [
  { day: 'monday', label: 'Monday – Friday', open: '09:00', close: '18:00' },
  { day: 'saturday', label: 'Saturday', open: '09:00', close: '16:00' },
  { day: 'sunday', label: 'Sunday', open: null, close: null },
  { day: 'public_holiday', label: 'Public holidays', open: null, close: null, byAppointmentOnly: true },
];

export const BLANK_SALON_SETTINGS: SalonSettings = {
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
  hours: BLANK_SALON_HOURS,
  vatIncluded: true,
  catalogueSource: 'custom',
  defaultConsentTemplateId: DEFAULT_CONSENT_TEMPLATE_ID,
};

export const STARTER_BRANDING: BrandingTokens = {
  id: 'default',
  primary: '#4a6b57',
  secondary: '#8baa8e',
  accent: '#c9a96e',
  background: '#e9e6e0',
  surface: '#fffdf9',
  text: '#333333',
  logoUrl: '/assets/salonflow-logo.png',
  markInitial: DEFAULT_MARK_INITIAL,
};
