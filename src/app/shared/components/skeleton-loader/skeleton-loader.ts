import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SkeletonVariant =
  | 'treatment-card'
  | 'treatment-detail'
  | 'therapist-card'
  | 'special'
  | 'admin-stat'
  | 'table-row'
  | 'consent-row'
  | 'text'
  | 'avatar'
  | 'block';

@Component({
  selector: 'sf-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton-loader.html',
  styleUrl: './skeleton-loader.scss',
})
export class SfSkeleton {
  readonly variant = input<SkeletonVariant>('block');
  readonly count = input(1);
  readonly ariaLabel = input('Loading content');

  repeat(): number[] {
    return Array.from({ length: Math.max(1, this.count()) }, (_, i) => i);
  }
}
