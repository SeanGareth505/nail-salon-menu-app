import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SfLottiePlayer } from '../lottie-player/lottie-player';

@Component({
  selector: 'sf-offline-state',
  standalone: true,
  imports: [SfLottiePlayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './offline-state.html',
  styleUrl: './offline-state.scss',
})
export class SfOfflineState {
  readonly title = input('You\'re offline');
  readonly message = input('Your saved salon menu is still available.');
  readonly reconnecting = input(false);
  readonly retry = output<void>();
}
