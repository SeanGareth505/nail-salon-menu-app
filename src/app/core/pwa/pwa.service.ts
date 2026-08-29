import { computed, inject, Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly swUpdate = inject(SwUpdate);

  readonly updateAvailable = signal(false);
  readonly updateDeferred = signal(false);
  private readonly installPromptEvent = signal<BeforeInstallPromptEvent | null>(null);
  readonly canInstall = computed(() => this.installPromptEvent() !== null);

  private consultationActive = false;

  init(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPromptEvent.set(event as BeforeInstallPromptEvent);
    });

    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        if (this.consultationActive) {
          this.updateDeferred.set(true);
        } else {
          this.updateAvailable.set(true);
        }
      });
  }

  setConsultationActive(active: boolean): void {
    this.consultationActive = active;
    if (!active && this.updateDeferred()) {
      this.updateDeferred.set(false);
      this.updateAvailable.set(true);
    }
  }

  dismissUpdate(): void {
    this.updateAvailable.set(false);
  }

  activateUpdate(): void {
    if (!this.swUpdate.isEnabled) return;
    void this.swUpdate.activateUpdate().then(() => location.reload());
  }

  async promptInstall(): Promise<void> {
    const event = this.installPromptEvent();
    if (!event) return;
    await event.prompt();
    this.installPromptEvent.set(null);
  }
}
