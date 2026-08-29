import { AuditFields, Money, WithId } from './common.model';

export interface Treatment extends WithId, AuditFields {
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string; // denormalized for list rendering
  shortDescription: string;
  description: string;
  durationMinutes: number;
  price: Money;
  onSpecial: boolean;
  specialId?: string | null;
  beforeAppointment: string[]; // bullet list
  performedByTherapistIds: string[];
  relatedTreatmentIds: string[];
  consentTemplateId: string | null; // which consent template applies, if any
  active: boolean;
  sortOrder: number;
}
