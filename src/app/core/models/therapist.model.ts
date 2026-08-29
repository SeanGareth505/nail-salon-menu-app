import { AuditFields, WithId } from './common.model';

export interface Therapist extends WithId, AuditFields {
  name: string;
  slug: string;
  role: string;               // e.g. "Senior Therapist"
  bio: string;
  experienceYears: number;
  qualification: string;
  expertise: string[];        // chip list
  initial: string;            // display initial for avatar/portrait
  tint: 'blush' | 'sage' | 'sky' | 'sand';
  userId: string | null;
  pinEnabled: boolean;
  active: boolean;
  sortOrder: number;
}
