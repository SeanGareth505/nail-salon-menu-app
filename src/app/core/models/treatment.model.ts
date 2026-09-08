import { AuditFields, Money, WithId } from './common.model';

export interface Treatment extends WithId, AuditFields {
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  shortDescription: string;
  description: string;
  durationMinutes: number;
  price: Money;
  onSpecial: boolean;
  specialId?: string | null;
  featured: boolean;
  imageUrl?: string | null;
  beforeAppointment: string[];
  performedByTherapistIds: string[];
  relatedTreatmentIds: string[];
  consentTemplateId: string | null;
  active: boolean;
  sortOrder: number;
}
