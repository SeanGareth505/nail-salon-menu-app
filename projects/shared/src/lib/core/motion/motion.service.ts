import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly reducedMotion = signal(false);
  readonly splashVisible = signal(true);
  readonly splashLeaving = signal(false);

  private splashMinMs = 80;
  private splashMaxMs = 900;
  private splashStartedAt = 0;
  private splashHideTimer: ReturnType<typeof setTimeout> | null = null;
  private splashExitTimer: ReturnType<typeof setTimeout> | null = null;
  private hideScheduled = false;
  private ready = false;

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
      this.splashMaxMs = 80;
    }

    this.splashStartedAt = performance.now();
    this.splashHideTimer = setTimeout(() => this.forceHideSplash(), this.splashMaxMs);
  }

  markReady(): void {
    this.ready = true;
    this.tryHideSplash();
  }

  staggerDelay(index: number, stepMs = 60): string {
    if (this.reducedMotion()) return '0ms';
    return `${Math.min(index * stepMs, 360)}ms`;
  }

  private tryHideSplash(): void {
    if (!this.ready || this.hideScheduled || !this.splashVisible()) return;

    const elapsed = performance.now() - this.splashStartedAt;
    const remaining = Math.max(0, this.splashMinMs - elapsed);

    if (this.splashHideTimer) {
      clearTimeout(this.splashHideTimer);
      this.splashHideTimer = null;
    }

    this.hideScheduled = true;
    this.splashHideTimer = setTimeout(() => this.beginSplashExit(), remaining);
  }

  private forceHideSplash(): void {
    if (!this.splashVisible() && !this.splashLeaving()) return;
    this.hideScheduled = true;
    this.beginSplashExit();
  }

  private beginSplashExit(): void {
    if (this.splashHideTimer) {
      clearTimeout(this.splashHideTimer);
      this.splashHideTimer = null;
    }
    if (!this.splashVisible()) return;

    this.splashLeaving.set(true);
    const exitMs = this.reducedMotion() ? 1 : 160;
    if (this.splashExitTimer) clearTimeout(this.splashExitTimer);
    this.splashExitTimer = setTimeout(() => {
      this.splashVisible.set(false);
      this.splashLeaving.set(false);
      this.splashExitTimer = null;
    }, exitMs);
  }
}
