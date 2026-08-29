import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SfBrandMark } from '../brand-mark/brand-mark';
import { SfIcon } from '../icon/icon';

@Component({
  selector: 'sf-therapist-rail',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SfIcon, SfBrandMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="rail">
      <a routerLink="/therapist" class="logo"><sf-brand-mark size="rail" tone="inverse" /></a>
      <nav>
        <a routerLink="/therapist" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <sf-icon name="calendar" [size]="24" /><span>Today</span>
        </a>
        <a routerLink="/therapist/consultations" routerLinkActive="active">
          <sf-icon name="clients" [size]="24" /><span>Clients</span>
        </a>
        <a routerLink="/therapist/consultations" routerLinkActive="active">
          <sf-icon name="records" [size]="24" /><span>Records</span>
        </a>
        <a routerLink="/treatments" target="_blank" rel="noopener">
          <sf-icon name="leaf" [size]="24" /><span>Menu</span>
        </a>
      </nav>
      <div class="profile">
        <button type="button" class="avatar" (click)="signOut()" [title]="'Sign out'">
          {{ initials() }}
        </button>
        <span class="name">{{ firstName() }}</span>
      </div>
    </aside>
  `,
  styles: [`
    .rail {
      width: 92px;
      flex: none;
      background: var(--sf-forest-dark);
      color: var(--sf-on-forest);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 22px 0;
      min-height: 100vh;
      gap: 8px;
    }
    .logo { display: flex; text-decoration: none; margin-bottom: 14px; }
    nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      width: 100%;
      align-items: center;
    }
    nav a {
      width: 64px;
      height: 64px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-decoration: none;
      color: rgba(255, 253, 249, 0.72);
      font-size: 0.6rem;
      border: 0;
      border-radius: 14px;
      background: transparent;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    nav a.active {
      background: rgba(255, 253, 249, 0.16);
      color: var(--sf-on-forest);
    }
    .profile {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding-top: 8px;
    }
    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 253, 249, 0.2);
      color: var(--sf-on-forest);
      border: none;
      font-family: var(--sf-font-display);
      font-size: 0.95rem;
      cursor: pointer;
    }
    .name {
      font-size: 0.6rem;
      color: rgba(255, 253, 249, 0.75);
    }
  `],
})
export class SfTherapistRail {
  private readonly auth = inject(AuthService);

  readonly firstName = computed(() => this.auth.displayName().split(' ')[0] || 'Staff');

  initials(): string {
    return this.auth.displayName().split(' ').map((p: string) => p[0]).join('').slice(0, 1).toUpperCase() || '•';
  }

  async signOut(): Promise<void> {
    await this.auth.signOutUser();
  }
}
