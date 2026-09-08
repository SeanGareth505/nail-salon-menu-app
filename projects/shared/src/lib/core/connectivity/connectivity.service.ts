import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Firestore,
  disableNetwork,
  enableNetwork,
  waitForPendingWrites,
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly firestore = inject(Firestore);

  readonly online = signal(true);
  readonly wasOffline = signal(false);
  readonly syncing = signal(false);
  readonly syncError = signal<string | null>(null);

  private syncInFlight: Promise<void> | null = null;

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.online.set(navigator.onLine);
    if (!navigator.onLine) {
      void this.goOffline();
    }

    window.addEventListener('online', () => {
      void this.goOnline();
    });
    window.addEventListener('offline', () => {
      void this.goOffline();
    });
  }

  async retry(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (navigator.onLine) {
      await this.goOnline();
      return;
    }
    this.online.set(false);
  }

  private async goOffline(): Promise<void> {
    this.online.set(false);
    this.syncing.set(false);
    this.syncError.set(null);
    try {
      await disableNetwork(this.firestore);
    } catch {
      void 0;
    }
  }

  private async goOnline(): Promise<void> {
    this.online.set(true);
    this.wasOffline.set(true);
    this.syncError.set(null);

    if (this.syncInFlight) {
      await this.syncInFlight;
      return;
    }

    this.syncInFlight = this.flushPendingWrites();
    try {
      await this.syncInFlight;
    } finally {
      this.syncInFlight = null;
      setTimeout(() => this.wasOffline.set(false), 2400);
    }
  }

  private async flushPendingWrites(): Promise<void> {
    this.syncing.set(true);
    try {
      await enableNetwork(this.firestore);
      await waitForPendingWrites(this.firestore);
    } catch {
      this.syncError.set('Could not sync yet. Changes are kept on this device.');
    } finally {
      this.syncing.set(false);
    }
  }
}
