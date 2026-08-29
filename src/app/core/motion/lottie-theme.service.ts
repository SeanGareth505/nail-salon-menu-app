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
      forest: hexToLottie(read('--sf-forest', '#3e5341')),
      sage: hexToLottie(read('--sf-sage', '#93ab94')),
      sageLight: hexToLottie(read('--sf-sage-light', '#dbe6db')),
      champagne: hexToLottie(read('--sf-champagne', '#c7a05e')),
      champagneLight: hexToLottie(read('--sf-champagne-light', '#f1e3c8')),
      ivory: hexToLottie(read('--sf-ivory', '#faf6ef')),
      ink: hexToLottie(read('--sf-ink', '#262620')),
      inkMuted: hexToLottie(read('--sf-ink-muted', '#6b6b60')),
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
