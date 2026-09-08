import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SalonIdentityService } from '../../../core/services/salon-identity.service';

export type BrandMarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'overlay' | 'rail';
export type BrandMarkTone = 'default' | 'inverse';

@Component({
  selector: 'sf-brand-mark',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-mark.html',
  styleUrl: './brand-mark.scss',
})
export class SfBrandMark {
  private readonly identity = inject(SalonIdentityService);

  readonly size = input<BrandMarkSize>('md');
  readonly tone = input<BrandMarkTone>('default');

  readonly initial = computed(() => this.identity.markInitial());
  readonly logoUrl = computed(() => this.identity.logoUrl());
  readonly sizeClass = computed(() => `size-${this.size()}`);
  readonly toneClass = computed(() => (this.tone() === 'inverse' && !this.logoUrl() ? 'inverse' : ''));
}
