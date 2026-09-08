import { FsTimestamp, WithId } from './common.model';

export type NotificationEventType =
  | 'consent_form_created'
  | 'consent_form_published'
  | 'consultation_completed'
  | 'consultation_started'
  | 'client_created';

export interface NotificationPreferences {
  enabled: boolean;
  pushEnabled: boolean;
  events: Record<NotificationEventType, boolean>;
}

export interface AppNotification extends WithId {
  recipientUid: string;
  type: NotificationEventType;
  title: string;
  body: string;
  read: boolean;
  link?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: FsTimestamp | null;
}

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEventType, string> = {
  consent_form_created: 'Consent form created',
  consent_form_published: 'Consent form published',
  consultation_completed: 'Consultation completed',
  consultation_started: 'Consultation started',
  client_created: 'New client added',
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  pushEnabled: false,
  events: {
    consent_form_created: true,
    consent_form_published: true,
    consultation_completed: true,
    consultation_started: false,
    client_created: false,
  },
};
