import { Injectable, computed, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly router = inject(Router);
  private readonly depth = signal(0);
  readonly navigating = signal(false);

  readonly message = signal('Loading…');
  readonly active = computed(() => this.depth() > 0);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigating.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navigating.set(false);
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
