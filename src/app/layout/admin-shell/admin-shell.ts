import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { SfAdminSidebar } from '../../shared/components/admin-sidebar/admin-sidebar';
import { SfIcon } from '../../shared/components/icon/icon';

const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/consultations': 'Consultations',
  '/admin/consent-forms': 'Consent forms',
  '/admin/clients': 'Clients',
  '/admin/treatments': 'Treatments',
  '/admin/categories': 'Categories',
  '/admin/therapists': 'Therapists',
  '/admin/specials': 'Specials',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Salon details',
  '/admin/branding': 'Branding',
  '/admin/qr-codes': 'QR codes',
  '/admin/users': 'Users',
};

function titleFor(url: string): string {
  const base = url.split('?')[0];
  if (TITLES[base]) return TITLES[base];
  if (base.startsWith('/admin/clients/')) return 'Client';
  return 'Admin';
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, SfAdminSidebar, SfIcon],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShell {
  private readonly router = inject(Router);

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => titleFor(this.router.url)),
      startWith(titleFor(this.router.url)),
    ),
    { initialValue: titleFor(this.router.url) },
  );

  readonly isDashboard = computed(() => this.pageTitle() === 'Dashboard');
}
