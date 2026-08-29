import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models';
import { SfIcon } from '../icon/icon';

@Component({
  selector: 'sf-category-tile',
  standalone: true,
  imports: [RouterLink, SfIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="tile" [routerLink]="['/treatments']" [queryParams]="{ category: category().slug }">
      <span class="circle" [class]="'tint-' + category().tint">
        <sf-icon [name]="category().icon" [size]="22" />
      </span>
      <span class="label">{{ category().name }}</span>
    </a>
  `,
  styles: [`
    .tile { display: flex; flex-direction: column; align-items: center; gap: var(--sf-space-2); text-decoration: none; color: var(--sf-ink); }
    .circle { width: 70px; height: 70px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(201, 169, 110, 0.28); }
    .tint-blush { background: var(--sf-blush); color: var(--sf-blush-fg); }
    .tint-sage { background: var(--sf-sage-light); color: var(--sf-forest); }
    .tint-sky { background: var(--sf-sky); color: var(--sf-sky-fg); }
    .tint-sand { background: var(--sf-sand); color: var(--sf-sand-fg); }
    .tile { transition: transform var(--sf-dur-fast) var(--sf-ease-standard); }
    @media (hover: hover) {
      .tile:hover { transform: translateY(-2px); }
    }
    .label { font-size: 0.72rem; font-weight: 400; color: rgba(51, 51, 51, 0.72); text-align: center; line-height: 1.3; }
  `],
})
export class SfCategoryTile {
  readonly category = input.required<Category>();
}
