import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EMPTY_MOTIF_ASSET, LottieAssetKey } from '../../../core/motion/lottie-assets';
import { SfLottiePlayer } from '../lottie-player/lottie-player';

@Component({
  selector: 'sf-empty-state',
  standalone: true,
  imports: [SfLottiePlayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <sf-lottie [asset]="asset()" width="160px" height="160px" [loop]="true" [speed]="0.85" />
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--sf-space-2);
      padding: var(--sf-space-6) var(--sf-space-4);
      color: var(--sf-ink-muted);
    }
    h3 {
      color: var(--sf-ink);
      font-size: 1.1rem;
      font-family: var(--sf-font-display);
      margin: 0;
    }
    p { max-width: 34ch; margin: 0; line-height: 1.55; }
  `],
})
export class SfEmptyState {
  readonly icon = input<string>('search');
  readonly title = input<string>('Nothing here yet');
  readonly message = input<string>('');

  readonly asset = computed<LottieAssetKey>(() => {
    const icon = this.icon();
    if (icon === 'specials') return 'emptySpecials';
    if (icon === 'treatments' || icon === 'droplet') return 'emptyTreatments';
    if (icon === 'records' || icon === 'calendar') return 'emptyConsultations';
    if (icon === 'clients' || icon === 'team') return 'emptyGeneric';
    if (icon === 'search') return 'emptySearch';
    return EMPTY_MOTIF_ASSET[icon] ?? 'emptyGeneric';
  });
}
