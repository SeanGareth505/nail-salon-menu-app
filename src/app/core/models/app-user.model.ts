import { AuditFields, WithId } from './common.model';
import { NotificationPreferences } from './notification.model';

export type AppRole = 'admin' | 'therapist';

export interface AppUser extends WithId, AuditFields {
  uid: string;
  email: string;
  displayName: string;
  role: AppRole;
  therapistId: string | null;
  active: boolean;
  notificationPreferences?: NotificationPreferences;
  fcmTokens?: string[];
}
