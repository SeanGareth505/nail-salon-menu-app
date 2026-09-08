import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SalonIdentityService } from '../../../core/services/salon-identity.service';
import { ADMIN_NAV_ITEMS } from '../../config/admin-nav.config';
import { SfBrandMark } from '../brand-mark/brand-mark';
import { SfIcon } from '../icon/icon';

@Component({
  selector: 'sf-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SfIcon, SfBrandMark],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sf-admin-sidebar-host' },
})
export class SfAdminSidebar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly identity = inject(SalonIdentityService);

  readonly navigated = output<void>();

  readonly items = ADMIN_NAV_ITEMS;

  displayName(): string {
    return this.auth.displayName() || 'Admin';
  }

  initials(): string {
    return (
      this.displayName()
        .split(' ')
        .map((p: string) => p[0])
        .join('')
        .slice(0, 1)
        .toUpperCase() || 'A'
    );
  }

  async signOut(): Promise<void> {
    await this.auth.signOutUser();
    await this.router.navigate(['/login'], { queryParams: { redirect: 'admin' } });
  }

  onNav(): void {
    this.navigated.emit();
  }
}
