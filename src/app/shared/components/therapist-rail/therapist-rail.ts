import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SalonIdentityService } from '../../../core/services/salon-identity.service';
import { SfBrandMark } from '../brand-mark/brand-mark';
import { SfIcon } from '../icon/icon';

interface TherapistNavItem {
  path: string;
  label: string;
  icon: string;
  exact: boolean;
}

const NAV_ITEMS: TherapistNavItem[] = [
  { path: '/therapist', label: 'Today', icon: 'calendar', exact: true },
  { path: '/therapist/clients', label: 'Clients', icon: 'clients', exact: false },
  { path: '/therapist/consent-forms', label: 'Consent forms', icon: 'records', exact: false },
  { path: '/therapist/menu', label: 'Menu', icon: 'leaf', exact: false },
];

@Component({
  selector: 'sf-therapist-rail',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SfIcon, SfBrandMark],
  templateUrl: './therapist-rail.html',
  styleUrl: './therapist-rail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SfTherapistRail {
  readonly identity = inject(SalonIdentityService);
  readonly navItems = NAV_ITEMS;
  readonly hideChrome = input(false);
}
