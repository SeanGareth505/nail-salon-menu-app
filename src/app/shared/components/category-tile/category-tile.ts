import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models';
import { categorySfIcon } from '../../utils/category-icon.util';
import { SfIcon } from '../icon/icon';

@Component({
  selector: 'sf-category-tile',
  standalone: true,
  imports: [RouterLink, SfIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      class="tile"
      [class]="'tint-' + category().tint"
      [routerLink]="['/treatments']"
      [queryParams]="{ category: category().slug }"
      [attr.aria-label]="'Browse ' + category().name + ' treatments'"
    >
      <sf-icon class="watermark" [name]="iconName()" [size]="88" [strokeWidth]="0.7" />
      <sf-icon class="icon" [name]="iconName()" [size]="24" [strokeWidth]="1.3" />
      <span class="copy">
        <span class="name">{{ category().name }}</span>
        <span class="count">{{ treatmentCount() }} treatments</span>
      </span>
    </a>
  `,
  styleUrl: './category-tile.scss',
})
export class SfCategoryTile {
  readonly category = input.required<Category>();
  readonly treatmentCount = input(0);

  readonly iconName = computed(() =>
    categorySfIcon(this.category().slug, this.category().icon),
  );
}
