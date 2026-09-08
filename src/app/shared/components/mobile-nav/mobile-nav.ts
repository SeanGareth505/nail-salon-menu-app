import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SfIcon } from '../icon/icon';

interface MobileNavItem {
  path: string;
  label: string;
  icon: string;
  exact: boolean;
}

const NAV_ITEMS: MobileNavItem[] = [
  { path: '/', label: 'Discover', icon: 'home', exact: true },
  { path: '/treatments', label: 'Treatments', icon: 'leaf', exact: false },
  { path: '/specials', label: 'Specials', icon: 'specials', exact: false },
  { path: '/therapists', label: 'Our team', icon: 'team', exact: false },
  { path: '/contact', label: 'Visit us', icon: 'map-pin', exact: false },
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
