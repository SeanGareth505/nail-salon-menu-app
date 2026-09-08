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
          @if (treatment().description) {
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
  styles: [`
    .mobile-only { display: inline; }
    .desktop-only { display: none; }
    .icon-header,
    .meta-row,
    .header-badge {
      display: none;
    }

    .row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      text-decoration: none;
      color: inherit;
      border-bottom: 1px solid rgba(74, 107, 87, 0.11);
    }
    .featured { align-items: center; padding: 14px 0; }
    .menu {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px 0;
      transition: background 0.2s ease;
    }
    .menu .body { flex: 1; min-width: 0; }
    .menu .duration {
      margin-top: 8px;
      font-size: 0.75rem;
    }
    .menu .price-col.mobile-only { flex: none; text-align: right; padding-top: 2px; display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
    .icon-tile {
      flex: none; width: 64px; height: 64px;
      display: flex; align-items: center; justify-content: center;
      color: var(--sf-forest);
    }
    .tint-blush { background: var(--sf-blush); }
    .tint-sage { background: var(--sf-sage-light); }
    .tint-sky { background: var(--sf-sky); }
    .tint-sand { background: var(--sf-sand); }
    .body { flex: 1; display: flex; flex-direction: column; min-width: 0; gap: 4px; }
    .name {
      font-family: var(--sf-font-display);
      font-size: 1rem;
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }
    .featured .name { font-size: 1.05rem; }
    .menu .name { font-size: 1.0625rem; font-weight: 400; }
    .special-pill, .bundle-pill {
      font-family: var(--sf-font-body);
      font-size: 0.56rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 4px 6px;
    }
    .special-pill {
      color: var(--sf-champagne-ink);
      border: 1px solid rgba(201, 169, 110, 0.6);
    }
    .bundle-pill {
      color: var(--sf-forest);
      border: 1px solid rgba(74, 107, 87, 0.35);
      background: var(--sf-sage-light);
    }
    .blurb { font-size: 0.78rem; color: rgba(51, 51, 51, 0.58); line-height: 1.55; max-width: 230px; font-weight: 300; }
    .duration {
      flex: none;
      font-size: 0.75rem;
      color: rgba(51, 51, 51, 0.45);
      font-weight: 400;
      font-variant-numeric: tabular-nums;
    }
    .meta { font-size: 0.78rem; color: var(--sf-ink-muted); font-weight: 300; }
    .price, .price-col .price {
      flex: none;
      font-weight: 500;
      color: var(--sf-forest);
      font-variant-numeric: tabular-nums;
    }
    .featured .price { font-size: 0.95rem; }
    .menu .price { font-size: 1rem; }
    .price.special { color: var(--sf-champagne-ink); }
    .price-col { text-align: right; padding-top: 2px; display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
    .featured-price { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .original { font-size: 0.78rem; font-weight: 300; color: rgba(51, 51, 51, 0.4); text-decoration: line-through; }

    @media (min-width: 768px) {
      .featured .icon-tile {
        width: 52px;
        height: 52px;
      }

      .featured .meta-category {
        display: none;
      }
    }

    @media (min-width: 834px) {
      .mobile-only { display: none !important; }
      .desktop-only { display: flex; }

      .icon-header,
      .meta-row {
        display: flex;
      }

      .header-badge {
        display: block;
      }

      .menu {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        padding: 0;
        margin: 0;
        border: 1px solid rgba(74, 107, 87, 0.15);
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        text-align: left;
        overflow: hidden;
      }

      .menu::before {
        display: none;
      }

      .menu .icon-header {
        display: flex;
        height: 96px;
        align-items: center;
        justify-content: center;
        position: relative;
        color: var(--sf-forest);
      }

      .header-badge {
        display: block;
        position: absolute;
        top: 10px;
        left: 10px;
        background: var(--sf-champagne);
        color: #fff;
        font-family: var(--sf-font-body);
        font-size: 0.56rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 6px 8px;
      }

      .menu .meta-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-top: 14px;
        padding-top: 13px;
        border-top: 1px solid rgba(74, 107, 87, 0.12);
      }

      .menu .body {
        padding: 16px 18px 18px;
        gap: 6px;
      }

      .menu .name {
        font-size: 1.125rem;
      }

      .menu .blurb {
        max-width: none;
        font-size: 0.8125rem;
        margin-top: 6px;
      }

      .menu .meta-row .duration {
        margin-top: 0;
        font-size: 0.78rem;
        color: rgba(51, 51, 51, 0.5);
      }

      .menu .meta-row .price-col {
        margin-left: auto;
        padding-top: 0;
        flex-direction: row;
        align-items: baseline;
        gap: 10px;
      }

      .menu .meta-row .price {
        font-size: 1.0625rem;
      }

      .menu:hover {
        transform: none;
        box-shadow: none;
        border-color: rgba(74, 107, 87, 0.15);
      }
    }
  `],
})
export class SfTreatmentCard {
  readonly treatment = input.required<Treatment>();
  readonly layout = input<'featured' | 'menu'>('featured');
  readonly tint = input<'blush' | 'sage' | 'sky' | 'sand'>('blush');
  readonly icon = input<string>('droplet');
  readonly specialView = input<TreatmentSpecialView | null>(null);
}
