import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  viewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { fromEvent, throttleTime } from 'rxjs';
import { SalonIdentityService } from '../../core/services/salon-identity.service';
import { SalonSettingsService } from '../../core/services/salon-settings.service';
import { AuthService } from '../../core/auth/auth.service';
import { SfIcon } from '../../shared/components/icon/icon';
import { SfMobileNav } from '../../shared/components/mobile-nav/mobile-nav';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SfMobileNav, SfIcon],
  templateUrl: './public-shell.html',
  styleUrl: './public-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicShell {
  readonly mainContent = viewChild<ElementRef<HTMLElement>>('mainContent');

  skipToContent(event: Event): void {
    event.preventDefault();
    this.mainContent()?.nativeElement.focus();
    this.mainContent()?.nativeElement.scrollIntoView({ block: 'start' });
  }

  protected readonly year = new Date().getFullYear();
  readonly identity = inject(SalonIdentityService);
  readonly auth = inject(AuthService);
  readonly topbarHidden = signal(false);
  readonly salon = toSignal(inject(SalonSettingsService).get(), { initialValue: undefined });

  private readonly destroyRef = inject(DestroyRef);
  private lastScrollY = 0;

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined') return;

      this.lastScrollY = window.scrollY;

      fromEvent(window, 'scroll', { passive: true })
        .pipe(throttleTime(80), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.onWindowScroll());
    });
  }

  private onWindowScroll(): void {
    const scrollY = window.scrollY;
    const delta = scrollY - this.lastScrollY;

    if (scrollY < 16) {
      this.topbarHidden.set(false);
    } else if (delta > 6) {
      this.topbarHidden.set(true);
    } else if (delta < -6) {
      this.topbarHidden.set(false);
    }

    this.lastScrollY = scrollY;
  }
}
