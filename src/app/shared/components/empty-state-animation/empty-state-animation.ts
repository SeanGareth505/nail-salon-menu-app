import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EMPTY_MOTIF_ASSET, LottieAssetKey } from '../../../core/motion/lottie-assets';
import { SfLottiePlayer } from '../lottie-player/lottie-player';

export type EmptyMotif = 'treatments' | 'specials' | 'consultations' | 'clients' | 'search' | 'generic';

@Component({
  selector: 'sf-empty-state-animation',
  standalone: true,
  imports: [SfLottiePlayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state-animation.html',
  styleUrl: './empty-state-animation.scss',
})
export class SfEmptyStateAnimation {
  readonly motif = input<EmptyMotif>('generic');
  readonly title = input('Nothing here yet');
  readonly message = input('');

  readonly asset = computed<LottieAssetKey>(() => EMPTY_MOTIF_ASSET[this.motif()] ?? 'emptyGeneric');
}
