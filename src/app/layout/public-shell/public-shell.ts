import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SalonIdentityService } from '../../core/services/salon-identity.service';
import { SfMobileNav } from '../../shared/components/mobile-nav/mobile-nav';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SfMobileNav],
  templateUrl: './public-shell.html',
  styleUrl: './public-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicShell {
  protected readonly year = new Date().getFullYear();
  readonly identity = inject(SalonIdentityService);
}
