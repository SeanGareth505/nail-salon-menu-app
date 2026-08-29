import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SalonIdentityService } from '../../../core/services/salon-identity.service';
import { SfBrandMark } from '../brand-mark/brand-mark';
import { SfIcon } from '../icon/icon';

interface NavItem { path: string; label: string; icon: string; exact: boolean; }

const ITEMS: NavItem[] = [
  { path: '/admin', label: 'Dashboard', icon: 'home', exact: true },
  { path: '/admin/consultations', label: 'Consultations', icon: 'records', exact: false },
  { path: '/admin/consent-forms', label: 'Consent forms', icon: 'records', exact: false },
  { path: '/admin/clients', label: 'Clients', icon: 'clients', exact: false },
  { path: '/admin/treatments', label: 'Treatments', icon: 'leaf', exact: false },
  { path: '/admin/categories', label: 'Categories', icon: 'filter', exact: false },
  { path: '/admin/therapists', label: 'Therapists', icon: 'team', exact: false },
  { path: '/admin/specials', label: 'Specials', icon: 'specials', exact: false },
  { path: '/admin/settings', label: 'Salon details', icon: 'building', exact: false },
  { path: '/admin/branding', label: 'Branding', icon: 'droplet', exact: false },
  { path: '/admin/qr-codes', label: 'QR codes', icon: 'qr', exact: false },
  { path: '/admin/analytics', label: 'Analytics', icon: 'clock', exact: false },
  { path: '/admin/users', label: 'Users', icon: 'clients', exact: false },
];

@Component({
  selector: 'sf-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SfIcon, SfBrandMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar">
      <div class="brand">
        <sf-brand-mark size="xs" tone="inverse" />
        <span>
          <strong>{{ identity.name() }}</strong>
          <small>{{ identity.city() }}</small>
        </span>
      </div>
      <nav>
        @for (item of items; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact }">
            <sf-icon [name]="item.icon" [size]="17" /><span>{{ item.label }}</span>
          </a>
        }
      </nav>
      <div class="footer">
        <span class="avatar">{{ initials() }}</span>
        <span class="body">
          <strong>{{ displayName() }}</strong>
          <small>Owner</small>
        </span>
        <button type="button" (click)="signOut()" title="Sign out"><sf-icon name="logout" [size]="16" /></button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 238px;
      flex: none;
      background: var(--sf-forest-dark);
      color: var(--sf-on-forest);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 24px 22px 26px;
    }
    .brand strong {
      display: block;
      font-size: 0.84rem;
      font-weight: 500;
    }
    .brand small {
      display: block;
      color: rgba(255, 253, 249, 0.55);
      font-size: 0.66rem;
      font-weight: 300;
      margin-top: 4px;
    }
    nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    nav a {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 44px;
      padding: 0 22px;
      text-decoration: none;
      color: rgba(255, 253, 249, 0.72);
      font-size: 0.84rem;
      font-weight: 400;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    nav a.active {
      background: rgba(255, 253, 249, 0.12);
      color: var(--sf-on-forest);
      font-weight: 500;
    }
    .footer {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 20px 22px 24px;
      border-top: 1px solid rgba(255, 253, 249, 0.12);
    }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255, 253, 249, 0.2);
      color: var(--sf-on-forest);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--sf-font-display);
      font-size: 0.82rem;
      flex: none;
    }
    .footer .body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .footer strong {
      font-size: 0.78rem;
      font-weight: 400;
    }
    .footer small {
      color: rgba(255, 253, 249, 0.55);
      font-size: 0.66rem;
      font-weight: 300;
      margin-top: 4px;
    }
    .footer button {
      background: transparent;
      border: none;
      color: rgba(255, 253, 249, 0.7);
      cursor: pointer;
    }
  `],
})
export class SfAdminSidebar {
  private readonly auth = inject(AuthService);
  readonly identity = inject(SalonIdentityService);

  readonly items = ITEMS;

  displayName(): string {
    return this.auth.displayName() || 'Admin';
  }
  initials(): string {
    return this.displayName().split(' ').map((p: string) => p[0]).join('').slice(0, 1).toUpperCase() || 'A';
  }
  async signOut(): Promise<void> {
    await this.auth.signOutUser();
  }
}
