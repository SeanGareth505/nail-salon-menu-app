import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SfLottiePlayer } from '../lottie-player/lottie-player';

@Component({
  selector: 'sf-success-animation',
  standalone: true,
  imports: [SfLottiePlayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './success-animation.html',
  styleUrl: './success-animation.scss',
})
export class SfSuccessAnimation {
  readonly title = input('Complete');
  readonly message = input('');
  readonly compact = input(false);
}
