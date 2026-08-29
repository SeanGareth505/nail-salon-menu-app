import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BrandMarkSize, SfBrandMark } from '../brand-mark/brand-mark';

export type SalonLoaderSize = 'splash' | 'overlay';

@Component({
  selector: 'sf-salon-loader',
  standalone: true,
  imports: [SfBrandMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './salon-loader.html',
  styleUrl: './salon-loader.scss',
})
export class SfSalonLoader {
  readonly size = input<SalonLoaderSize>('splash');

  readonly sizeClass = computed(() => `size-${this.size()}`);
  readonly markSize = computed<BrandMarkSize>(() => (this.size() === 'splash' ? 'xl' : 'overlay'));
}
