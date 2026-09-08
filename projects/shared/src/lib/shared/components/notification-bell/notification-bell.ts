import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, authState } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { switchMap, of } from 'rxjs';
import { AppNotification } from '../../../core/models';
import { NotificationsService } from '../../../core/services/notifications.service';
import { SfIcon } from '../icon/icon';

@Component({
  selector: 'sf-notification-bell',
  standalone: true,
  imports: [SfIcon],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.inverted]': 'inverted()',
    '[class.open]': 'open()',
  },
})
export class SfNotificationBell {
  private readonly auth = inject(Auth);
  private readonly notificationsSvc = inject(NotificationsService);
  private readonly router = inject(Router);

  readonly inverted = input(false);

  readonly open = signal(false);
  readonly items = toSignal(
    authState(this.auth).pipe(
      switchMap((user) => (user ? this.notificationsSvc.listForRecipient(user.uid) : of([] as AppNotification[]))),
    ),
    { initialValue: [] as AppNotification[] },
  );
  readonly unreadCount = computed(() => this.items().filter((item) => !item.read).length);

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  async openItem(item: AppNotification): Promise<void> {
    if (!item.read) {
      await this.notificationsSvc.markRead(item.id);
    }
    this.close();
    if (item.link) {
      await this.router.navigateByUrl(item.link);
    }
  }

  async markAllRead(): Promise<void> {
    const unread = this.items().filter((item) => !item.read).map((item) => item.id);
    await this.notificationsSvc.markAllRead(unread);
  }
}
