import { AuditFields, WithId } from './common.model';

export type AppRole = 'admin' | 'therapist';

export interface AppUser extends WithId, AuditFields {
  uid: string;              // Firebase Auth UID, same as id
  email: string;
  displayName: string;
  role: AppRole;
  therapistId: string | null; // linked Therapist doc, when role === 'therapist'
  active: boolean;
}
