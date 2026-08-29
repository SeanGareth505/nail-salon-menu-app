import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SfSalonLoader } from '../salon-loader/salon-loader';

@Component({
  selector: 'sf-loading-overlay',
  standalone: true,
  imports: [SfSalonLoader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.scss',
})
export class SfLoadingOverlay {
  readonly message = input('Loading…');
  readonly inline = input(false);
  readonly progress = input<number | null>(null);
}
