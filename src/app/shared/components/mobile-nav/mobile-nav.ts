import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SfIcon } from '../icon/icon';

interface MobileNavItem {
  path: string;
  label: string;
  icon: string;
  exact: boolean;
  center?: boolean;
}

const NAV_ITEMS: MobileNavItem[] = [
  { path: '/specials', label: 'Specials', icon: 'specials', exact: false },
  { path: '/treatments', label: 'Treatments', icon: 'leaf', exact: false },
  { path: '/', label: 'Home', icon: 'home', exact: true, center: true },
  { path: '/therapists', label: 'Team', icon: 'team', exact: false },
  { path: '/contact', label: 'Contact', icon: 'phone', exact: false },
];

@Component({
  selector: 'sf-mobile-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SfIcon],
  templateUrl: './mobile-nav.html',
  styleUrl: './mobile-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SfMobileNav {
  readonly items = NAV_ITEMS;
}
