import { DOCUMENT, Injectable, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BrandingService } from '../services/branding.service';
import { LottieLoaderService } from '../motion/lottie-loader.service';

/**
 * Applies the admin-editable branding doc onto the live --sf-* CSS custom
 * properties. Called once from AppComponent; components never read
 * branding directly — they just use the --sf-* / --mat-sys-* variables and
 * pick up changes automatically because these are plain CSS custom
 * properties, not compiled Sass.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly branding = inject(BrandingService);
  private readonly lottieLoader = inject(LottieLoaderService);
  private readonly brandingSignal = toSignal(this.branding.get(), { initialValue: undefined });

  private readonly applyEffect = effect(() => {
    const tokens = this.brandingSignal();
    if (!tokens) return;
    const root = this.document.documentElement.style;
    if (tokens.primary) root.setProperty('--sf-forest', tokens.primary);
    if (tokens.secondary) root.setProperty('--sf-sage', tokens.secondary);
    if (tokens.accent) root.setProperty('--sf-champagne', tokens.accent);
    if (tokens.background) root.setProperty('--sf-canvas', tokens.background);
    if (tokens.surface) {
      root.setProperty('--sf-surface', tokens.surface);
      root.setProperty('--sf-ivory', tokens.surface);
    }
    if (tokens.text) root.setProperty('--sf-ink', tokens.text);
    this.lottieLoader.invalidate();
  });

  init(): void {
    // touching the signal in the constructor above is enough to activate
    // the effect; this method exists purely as an explicit bootstrap hook.
  }
}
