import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly online = signal(true);
  readonly wasOffline = signal(false);

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.online.set(navigator.onLine);
    window.addEventListener('online', () => {
      this.online.set(true);
      this.wasOffline.set(true);
      setTimeout(() => this.wasOffline.set(false), 2400);
    });
    window.addEventListener('offline', () => this.online.set(false));
  }
}
