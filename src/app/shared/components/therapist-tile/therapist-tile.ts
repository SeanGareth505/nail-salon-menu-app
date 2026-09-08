import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Therapist } from '../../../core/models';

@Component({
  selector: 'sf-therapist-tile',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      class="tile"
      [routerLink]="['/therapists', therapist().id]"
      [attr.aria-label]="'View ' + therapist().name + ' profile'"
    >
      <span class="circle" [class]="'tint-' + therapist().tint">
        {{ therapist().initial }}
      </span>
      <span class="name">{{ therapist().name.split(' ')[0] }}</span>
      <span class="role">{{ therapist().role }}</span>
    </a>
  `,
  styleUrl: './therapist-tile.scss',
})
export class SfTherapistTile {
  readonly therapist = input.required<Therapist>();
}
