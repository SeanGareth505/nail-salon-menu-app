import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly router = inject(Router);
  private readonly depth = signal(0);
  private navigationDepth = 0;

  readonly message = signal('Loading…');
  readonly active = computed(() => this.depth() > 0);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (this.navigationDepth === 0) {
          this.begin('Loading…');
        }
        this.navigationDepth += 1;
        return;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navigationDepth = Math.max(0, this.navigationDepth - 1);
        if (this.navigationDepth === 0) {
          this.end();
        }
      }
    });
  }

  begin(message = 'Loading…'): void {
    this.message.set(message);
    this.depth.update((count) => count + 1);
  }

  end(): void {
    this.depth.update((count) => Math.max(0, count - 1));
  }

  async run<T>(task: () => Promise<T>, message = 'Loading…'): Promise<T> {
    this.begin(message);
    try {
      return await task();
    } finally {
      this.end();
    }
  }
}
