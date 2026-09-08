import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_EVENT_LABELS,
  NotificationEventType,
  NotificationPreferences,
} from '../../../core/models';
import { NotificationPreferencesService } from '../../../core/services/notification-preferences.service';
import { PushNotificationService } from '../../../core/services/push-notification.service';
import { SfPageActionDirective } from '../../../shared/directives/page-action.directive';

const EVENT_TYPES = Object.keys(NOTIFICATION_EVENT_LABELS) as NotificationEventType[];

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [FormsModule, SfPageActionDirective],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications {
  private readonly prefsSvc = inject(NotificationPreferencesService);
  private readonly pushSvc = inject(PushNotificationService);

  readonly pageAction = (): void => {
    void this.save();
  };

  readonly eventTypes = EVENT_TYPES;
  readonly eventLabels = NOTIFICATION_EVENT_LABELS;
  readonly pushSupported = this.pushSvc.supported;

  readonly remote = toSignal(this.prefsSvc.currentPreferences(), { initialValue: DEFAULT_NOTIFICATION_PREFERENCES });
  readonly form = signal<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  readonly saved = signal(false);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly pushPermission = signal<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );
  private loaded = false;

  constructor() {
    effect(() => {
      const prefs = this.remote();
      if (!this.loaded) {
        this.loaded = true;
        this.form.set({
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...prefs,
          events: { ...DEFAULT_NOTIFICATION_PREFERENCES.events, ...prefs.events },
        });
      }
    });
  }

  setEnabled(enabled: boolean): void {
    this.form.update((prefs) => ({ ...prefs, enabled }));
  }

  async setPushEnabled(pushEnabled: boolean): Promise<void> {
    this.error.set('');
    if (pushEnabled) {
      const granted = await this.pushSvc.enablePush();
      this.pushPermission.set(Notification.permission);
      if (!granted) {
        this.error.set('Browser push permission was denied or unavailable.');
        return;
      }
    } else {
      await this.pushSvc.disablePush();
    }
    this.form.update((prefs) => ({ ...prefs, pushEnabled }));
  }

  setEvent(type: NotificationEventType, enabled: boolean): void {
    this.form.update((prefs) => ({
      ...prefs,
      events: { ...prefs.events, [type]: enabled },
    }));
  }

  async save(): Promise<void> {
    this.error.set('');
    this.saving.set(true);
    try {
      await this.prefsSvc.ensureProfile();
      const prefs = this.form();
      if (prefs.pushEnabled) {
        await this.pushSvc.syncTokenIfEnabled();
      }
      await this.prefsSvc.save(prefs);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
    } catch {
      this.error.set('Could not save notification settings.');
    } finally {
      this.saving.set(false);
    }
  }
}
