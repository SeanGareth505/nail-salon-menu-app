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
      forest: hexToLottie(read('--sf-forest', '#4a6b57')),
      sage: hexToLottie(read('--sf-sage', '#8baa8e')),
      sageLight: hexToLottie(read('--sf-sage-light', '#f0f4f0')),
      champagne: hexToLottie(read('--sf-champagne', '#c9a96e')),
      champagneLight: hexToLottie(read('--sf-champagne-light', '#f5efe7')),
      ivory: hexToLottie(read('--sf-ivory', '#fffdf9')),
      ink: hexToLottie(read('--sf-ink', '#333333')),
      inkMuted: hexToLottie(read('--sf-ink-muted', '#9e9e96')),
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
