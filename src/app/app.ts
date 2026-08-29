import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from './core/theme/theme.service';
import { SalonTitleService } from './core/services/salon-title.service';
import { PwaService } from './core/pwa/pwa.service';
import { MotionService } from './core/motion/motion.service';
import { ConnectivityService } from './core/connectivity/connectivity.service';
import { SfPwaUpdateBanner } from './shared/components/pwa-update-banner/pwa-update-banner';
import { SfBrandedSplash } from './shared/components/branded-splash/branded-splash';
import { SfOfflineState } from './shared/components/offline-state/offline-state';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SfPwaUpdateBanner, SfBrandedSplash, SfOfflineState],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly theme = inject(ThemeService);
  private readonly salonTitle = inject(SalonTitleService);
  private readonly pwa = inject(PwaService);
  private readonly motion = inject(MotionService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly router = inject(Router);

  readonly online = this.connectivity.online;

  constructor() {
    this.theme.init();
    this.salonTitle.init();
    this.pwa.init();
    this.motion.init();
    this.connectivity.init();

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.motion.markReady();
    });
  }
}
