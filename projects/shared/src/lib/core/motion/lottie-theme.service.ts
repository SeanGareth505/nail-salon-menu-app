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
      forest: hexToLottie(read('--sf-forest', '#5b2b45')),
      sage: hexToLottie(read('--sf-sage', '#7c9a8e')),
      sageLight: hexToLottie(read('--sf-sage-light', '#e3ede8')),
      champagne: hexToLottie(read('--sf-champagne', '#c08a4a')),
      champagneLight: hexToLottie(read('--sf-champagne-light', '#f8eedd')),
      ivory: hexToLottie(read('--sf-ivory', '#ffffff')),
      ink: hexToLottie(read('--sf-ink', '#2a1f26')),
      inkMuted: hexToLottie(read('--sf-ink-muted', '#6e5f67')),
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
