import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from '@core/theme/theme.service';
import { SalonTitleService } from '@core/services/salon-title.service';
import { LoadingService } from '@core/services/loading.service';
import { PwaService } from '@core/pwa/pwa.service';
import { MotionService } from '@core/motion/motion.service';
import { ConnectivityService } from '@core/connectivity/connectivity.service';
import { SfPwaUpdateBanner } from '@shared/components/pwa-update-banner/pwa-update-banner';
import { SfBrandedSplash } from '@shared/components/branded-splash/branded-splash';
import { SfOfflineState } from '@shared/components/offline-state/offline-state';
import { SfLoadingOverlay } from '@shared/components/loading-overlay/loading-overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SfPwaUpdateBanner, SfBrandedSplash, SfOfflineState, SfLoadingOverlay],
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
  readonly loading = inject(LoadingService);

  readonly online = this.connectivity.online;
  readonly syncing = this.connectivity.syncing;
  readonly wasOffline = this.connectivity.wasOffline;
  readonly syncError = this.connectivity.syncError;

  readonly offlineTitle = computed(() => {
    if (this.syncing()) return 'Back online';
    if (this.syncError()) return 'Sync delayed';
    if (this.wasOffline()) return 'Synced';
    return "You're offline";
  });

  readonly offlineMessage = computed(() => {
    if (this.syncing()) return 'Uploading saved changes to the cloud…';
    if (this.syncError()) return this.syncError()!;
    if (this.wasOffline()) return 'Your changes are on the cloud again.';
    return 'You can keep working. Changes stay on this device and upload when you reconnect.';
  });

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

  retryConnection(): void {
    void this.connectivity.retry();
  }
}
