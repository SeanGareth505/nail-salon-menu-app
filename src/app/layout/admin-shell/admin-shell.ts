import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AdminChromeService } from '../../core/services/admin-chrome.service';
import { PushNotificationService } from '../../core/services/push-notification.service';
import { ADMIN_NAV_ITEMS, adminActionForUrl, adminTitleForUrl } from '../../shared/config/admin-nav.config';
import { SfAdminSidebar } from '../../shared/components/admin-sidebar/admin-sidebar';
import { SfIcon } from '../../shared/components/icon/icon';
import { SfNotificationBell } from '../../shared/components/notification-bell/notification-bell';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SfAdminSidebar, SfIcon, SfNotificationBell],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShell {
  private readonly router = inject(Router);
  private readonly push = inject(PushNotificationService);
  private readonly chrome = inject(AdminChromeService);
  private readonly breakpoints = inject(BreakpointObserver);

  readonly menuOpen = signal(false);
  readonly navItems = ADMIN_NAV_ITEMS;

  readonly layout = toSignal(
    this.breakpoints
      .observe(['(max-width: 767px)', '(min-width: 768px) and (max-width: 1099px)', '(min-width: 1100px)'])
      .pipe(map((r) => (r.breakpoints['(max-width: 767px)'] ? 'sm' : r.breakpoints['(min-width: 768px) and (max-width: 1099px)'] ? 'md' : 'lg'))),
    { initialValue: 'lg' as 'sm' | 'md' | 'lg' },
  );

  constructor() {
    void this.push.syncTokenIfEnabled();
  }

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly pageTitle = computed(() => adminTitleForUrl(this.currentUrl()));
  readonly pageAction = computed(() => adminActionForUrl(this.currentUrl()));
  readonly showPageAction = computed(() => !!this.pageAction() && !this.chrome.pageActionHidden());
  readonly isNarrow = computed(() => this.layout() === 'sm');

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onPageAction(): void {
    if (this.chrome.pageActionHandler()) {
      this.chrome.triggerPageAction();
    }
  }
}
