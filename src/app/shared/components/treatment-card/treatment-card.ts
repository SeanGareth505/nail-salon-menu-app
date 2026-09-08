import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Treatment } from '../../../core/models';
import { TreatmentSpecialView } from '../../../core/specials/special-pricing.util';
import { FormatRandPipe } from '../../pipes/format-rand.pipe';
import { SfIcon } from '../icon/icon';

@Component({
  selector: 'sf-treatment-card',
  standalone: true,
  imports: [RouterLink, SfIcon, FormatRandPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (layout() === 'menu') {
      <a class="row menu sf-motion-card" [routerLink]="['/treatments', treatment().id]">
        <span class="icon-header" [class]="'tint-' + tint()">
          <sf-icon [name]="icon()" [size]="34" />
          @if (specialView()?.badge === 'special') {
            <span class="header-badge">Special</span>
          }
        </span>
        <span class="body">
          <span class="name">
            {{ treatment().name }}
            @if (specialView()?.badge === 'special') { <span class="special-pill mobile-only">Special</span> }
            @if (specialView()?.badge === 'bundle') { <span class="bundle-pill">Bundle</span> }
          </span>
          @if (treatment().shortDescription || treatment().description) {
            <span class="blurb">{{ treatment().shortDescription || treatment().description }}</span>
          }
          <span class="meta-row">
            <span class="duration">{{ treatment().durationMinutes }} min</span>
            <span class="price-col">
              @if (specialView()?.badge === 'special' && specialView()?.displayPrice != null) {
                <span class="price special">{{ specialView()!.displayPrice | formatRand }}</span>
                <span class="original">{{ specialView()!.originalPrice | formatRand }}</span>
              } @else {
                <span class="price">{{ treatment().price | formatRand }}</span>
              }
            </span>
          </span>
          <span class="duration mobile-only">{{ treatment().durationMinutes }} minutes</span>
        </span>
        <span class="price-col mobile-only">
          @if (specialView()?.badge === 'special' && specialView()?.displayPrice != null) {
            <span class="price special">{{ specialView()!.displayPrice | formatRand }}</span>
            <span class="original">{{ specialView()!.originalPrice | formatRand }}</span>
          } @else {
            <span class="price">{{ treatment().price | formatRand }}</span>
          }
        </span>
      </a>
    } @else {
      <a class="row featured sf-motion-card" [routerLink]="['/treatments', treatment().id]">
        <span class="icon-tile" [class]="'tint-' + tint()">
          <sf-icon [name]="icon()" [size]="24" />
        </span>
        <span class="body">
          <span class="name">
            {{ treatment().name }}
            @if (specialView()?.badge === 'special') { <span class="special-pill">Special</span> }
            @if (specialView()?.badge === 'bundle') { <span class="bundle-pill">Bundle</span> }
          </span>
          <span class="meta"><span class="meta-duration">{{ treatment().durationMinutes }} min</span>@if (treatment().categoryName) {<span class="meta-category"> · {{ treatment().categoryName }}</span>}</span>
        </span>
        @if (specialView()?.badge === 'special' && specialView()?.displayPrice != null) {
          <span class="price-col featured-price">
            <span class="price special">{{ specialView()!.displayPrice | formatRand }}</span>
            <span class="original">{{ specialView()!.originalPrice | formatRand }}</span>
          </span>
        } @else {
          <span class="price">{{ treatment().price | formatRand }}</span>
        }
      </a>
    }
  `,
  styleUrl: './treatment-card.scss',
})
export class SfTreatmentCard {
  readonly treatment = input.required<Treatment>();
  readonly layout = input<'featured' | 'menu'>('featured');
  readonly tint = input<'blush' | 'sage' | 'sky' | 'sand'>('blush');
  readonly icon = input<string>('droplet');
  readonly specialView = input<TreatmentSpecialView | null>(null);
}
