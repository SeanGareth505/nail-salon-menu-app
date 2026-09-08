export interface SalonHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 'public_holiday';
  label: string;
  open: string | null;  // '09:00' or null when closed
  close: string | null; // '18:00' or null when closed
  byAppointmentOnly?: boolean;
}

export interface SalonSettings {
  id: 'default';
  name: string;
  tagline: string;
  subtext: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  mapLat?: number;
  mapLng?: number;
  locationNote?: string;
  hours: SalonHours[];
  vatIncluded: boolean;
  catalogueSource?: 'demo' | 'custom';
  defaultConsentTemplateId?: string;
}
