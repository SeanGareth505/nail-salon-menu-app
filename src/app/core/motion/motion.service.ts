import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly reducedMotion = signal(false);
  readonly splashVisible = signal(true);
  readonly splashLeaving = signal(false);

  private splashMinMs = 380;
  private splashMaxMs = 1100;
  private splashStartedAt = 0;
  private splashHideTimer: ReturnType<typeof setTimeout> | null = null;

  init(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.splashVisible.set(false);
      return;
    }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion.set(mq.matches);
    mq.addEventListener('change', (e) => this.reducedMotion.set(e.matches));

    if (this.reducedMotion()) {
      this.splashMinMs = 0;
      this.splashMaxMs = 120;
    }

    this.splashStartedAt = performance.now();
    this.splashHideTimer = setTimeout(() => this.tryHideSplash(), this.splashMaxMs);
  }

  markReady(): void {
    this.tryHideSplash();
  }

  staggerDelay(index: number, stepMs = 60): string {
    if (this.reducedMotion()) return '0ms';
    return `${Math.min(index * stepMs, 360)}ms`;
  }

  private tryHideSplash(): void {
    if (this.splashLeaving()) return;
    const elapsed = performance.now() - this.splashStartedAt;
    const remaining = Math.max(0, this.splashMinMs - elapsed);

    if (this.splashHideTimer) clearTimeout(this.splashHideTimer);
    this.splashHideTimer = setTimeout(() => {
      this.splashLeaving.set(true);
      const exitMs = this.reducedMotion() ? 1 : 280;
      setTimeout(() => this.splashVisible.set(false), exitMs);
    }, remaining);
  }
}
