import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SalonIdentityService } from '../../../core/services/salon-identity.service';

export type SalonLoaderSize = 'splash' | 'overlay';

@Component({
  selector: 'sf-salon-loader',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './salon-loader.html',
  styleUrl: './salon-loader.scss',
})
export class SfSalonLoader {
  readonly identity = inject(SalonIdentityService);
  readonly size = input<SalonLoaderSize>('splash');
  readonly sizeClass = computed(() => `size-${this.size()}`);
}
