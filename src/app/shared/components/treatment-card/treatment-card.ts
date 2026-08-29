import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Treatment } from '../../../core/models';
import { SfIcon } from '../icon/icon';

@Component({
  selector: 'sf-treatment-card',
  standalone: true,
  imports: [RouterLink, SfIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (layout() === 'menu') {
      <a class="row menu sf-motion-card" [routerLink]="['/treatments', treatment().id]">
        <span class="body">
          <span class="name">
            {{ treatment().name }}
            @if (treatment().onSpecial) { <span class="special-pill">Special</span> }
          </span>
          @if (treatment().description) {
            <span class="blurb">{{ treatment().description }}</span>
          }
          <span class="duration">{{ treatment().durationMinutes }} minutes</span>
        </span>
        <span class="price-col">
          <span class="price" [class.special]="treatment().onSpecial">R{{ treatment().price }}</span>
        </span>
      </a>
    } @else {
      <a class="row featured sf-motion-card" [routerLink]="['/treatments', treatment().id]">
        <span class="icon-tile" [class]="'tint-' + tint()">
          <sf-icon [name]="icon()" [size]="24" />
        </span>
        <span class="body">
          <span class="name">{{ treatment().name }}</span>
          <span class="meta">{{ treatment().durationMinutes }} min · {{ treatment().categoryName }}</span>
        </span>
        <span class="price">R{{ treatment().price }}</span>
      </a>
    }
  `,
  styles: [`
    .row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      text-decoration: none;
      color: inherit;
      border-bottom: 1px solid rgba(74, 107, 87, 0.11);
      animation: sf-motion-rise-in var(--sf-dur-normal) var(--sf-ease-enter) both;
    }
    .featured { align-items: center; padding: 14px 0; }
    .menu { padding: 16px 0; }
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
    .menu .name { font-size: 1.05rem; }
    .special-pill {
      font-family: var(--sf-font-body);
      font-size: 0.56rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--sf-champagne-ink);
      border: 1px solid rgba(201, 169, 110, 0.6);
      padding: 4px 6px;
    }
    .blurb { font-size: 0.8rem; color: var(--sf-ink-muted); line-height: 1.55; max-width: 230px; font-weight: 300; }
    .duration { font-size: 0.75rem; color: rgba(51, 51, 51, 0.45); margin-top: 4px; }
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
    .price-col { text-align: right; padding-top: 2px; }
  `],
})
export class SfTreatmentCard {
  readonly treatment = input.required<Treatment>();
  readonly layout = input<'featured' | 'menu'>('featured');
  readonly tint = input<'blush' | 'sage' | 'sky' | 'sand'>('blush');
  readonly icon = input<string>('droplet');
}
