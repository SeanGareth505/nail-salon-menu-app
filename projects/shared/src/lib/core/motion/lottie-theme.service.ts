import { DOCUMENT, Injectable, inject } from '@angular/core';
import {
  DEFAULT_LOTTIE_PALETTE,
  LottieThemePalette,
  applyLottieTheme,
  applySuccessCheckTheme,
  hexToLottie,
} from './lottie-theme.util';
import { LottieAssetKey } from './lottie-assets';

@Injectable({ providedIn: 'root' })
export class LottieThemeService {
  private readonly document = inject(DOCUMENT);

  palette(): LottieThemePalette {
    if (typeof window === 'undefined') return DEFAULT_LOTTIE_PALETTE;

    const styles = getComputedStyle(this.document.documentElement);
    const read = (token: string, fallback: string) => styles.getPropertyValue(token).trim() || fallback;

    return {
      forest: hexToLottie(read('--sf-forest', '#6f8f7a')),
      sage: hexToLottie(read('--sf-sage', '#a3b9ab')),
      sageLight: hexToLottie(read('--sf-sage-light', '#e8f0eb')),
      champagne: hexToLottie(read('--sf-champagne', '#c2a888')),
      champagneLight: hexToLottie(read('--sf-champagne-light', '#f3eee5')),
      ivory: hexToLottie(read('--sf-ivory', '#fafbf9')),
      ink: hexToLottie(read('--sf-ink', '#2e3531')),
      inkMuted: hexToLottie(read('--sf-ink-muted', '#6a746e')),
    };
  }

  themedAnimation(data: unknown, asset: LottieAssetKey): unknown {
    const palette = this.palette();
    if (asset === 'successCompact') {
      return applySuccessCheckTheme(data, palette);
    }
    return applyLottieTheme(data, palette);
  }
}
