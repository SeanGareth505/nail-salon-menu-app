import { AuditFields, WithId } from './common.model';

export interface TherapistStaffAccess extends WithId, Partial<AuditFields> {
  therapistId: string;
  pin: string;
}
