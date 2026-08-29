import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SfIcon } from '../icon/icon';

interface NavItem { path: string; label: string; icon: string; exact: boolean; }

const ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: 'home', exact: true },
  { path: '/treatments', label: 'Treatments', icon: 'treatments', exact: false },
  { path: '/specials', label: 'Specials', icon: 'specials', exact: false },
  { path: '/therapists', label: 'Team', icon: 'team', exact: false },
  { path: '/contact', label: 'Contact', icon: 'contact', exact: false },
];

@Component({
  selector: 'sf-mobile-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SfIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="bar" aria-label="Primary">
      @for (item of items; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.exact }"
          #rla="routerLinkActive"
        >
          <span class="icon-wrap" [class.active]="rla.isActive">
            <sf-icon [name]="item.icon" [size]="21" />
          </span>
          <span class="label">{{ item.label }}</span>
          <span class="indicator" [class.visible]="rla.isActive"></span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .bar {
      position: sticky; bottom: 0; left: 0; right: 0;
      display: flex;
      background: rgba(255, 253, 249, 0.96);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(74, 107, 87, 0.13);
      padding: 6px max(6px, env(safe-area-inset-left)) max(6px, env(safe-area-inset-bottom));
      z-index: 20;
    }
    a {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      text-decoration: none;
      color: var(--sf-ink-muted);
      font-size: 0.68rem;
      padding: 6px 0 8px;
      border-radius: var(--sf-radius-sm);
    }
    .icon-wrap {
      display: flex;
      transition: transform var(--sf-dur-fast) var(--sf-ease-standard), opacity var(--sf-dur-fast) var(--sf-ease-standard);
      opacity: 0.75;
    }
    .icon-wrap.active {
      transform: translateY(-2px);
      opacity: 1;
    }
    a.active { color: var(--sf-forest); font-weight: 600; }
    .label { transition: color var(--sf-dur-fast) var(--sf-ease-standard); }
    .indicator {
      position: absolute;
      bottom: 2px;
      width: 18px;
      height: 2px;
      border-radius: var(--sf-radius-pill);
      background: var(--sf-champagne);
      opacity: 0;
      transform: scaleX(0.4);
      transition: opacity var(--sf-dur-normal) var(--sf-ease-enter), transform var(--sf-dur-normal) var(--sf-ease-enter);
    }
    .indicator.visible {
      opacity: 1;
      transform: scaleX(1);
    }
  `],
})
export class SfMobileNav {
  readonly items = ITEMS;
}
