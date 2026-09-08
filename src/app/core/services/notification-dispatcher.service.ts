import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AppUser, NotificationEventType } from '../models';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../models/notification.model';
import { NotificationsService } from './notifications.service';
import { UsersService } from './users.service';

export interface NotificationPayload {
  type: NotificationEventType;
  title: string;
  body: string;
  link?: string;
  entityType?: string;
  entityId?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationDispatcherService {
  private readonly usersSvc = inject(UsersService);
  private readonly notificationsSvc = inject(NotificationsService);
  private readonly auth = inject(AuthService);

  async notifyAdmins(payload: NotificationPayload): Promise<void> {
    const actorUid = this.auth.currentUid();
    const admins = await firstValueFrom(this.usersSvc.listAll());
    const recipients = admins.filter((admin) => this.shouldNotify(admin, payload.type, actorUid));
    await Promise.all(recipients.map((admin) => this.notificationsSvc.createNotification({
      recipientUid: admin.uid,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
      entityType: payload.entityType,
      entityId: payload.entityId,
    })));
  }

  private shouldNotify(admin: AppUser, type: NotificationEventType, actorUid: string | null): boolean {
    if (!admin.active || admin.role !== 'admin') return false;
    if (actorUid && admin.uid === actorUid) return false;
    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(admin.notificationPreferences ?? {}),
      events: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.events,
        ...(admin.notificationPreferences?.events ?? {}),
      },
    };
    if (!prefs.enabled) return false;
    return prefs.events[type];
  }
}
