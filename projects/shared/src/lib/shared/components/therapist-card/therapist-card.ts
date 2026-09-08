import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SfPortrait } from '../portrait/portrait';
import { Therapist } from '../../../core/models';

@Component({
  selector: 'sf-therapist-card',
  standalone: true,
  imports: [RouterLink, SfPortrait],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (full()) {
      <article class="profile" [class.has-photo]="!!therapist().imageUrl">
        <a class="portrait-link" [routerLink]="['/therapists', therapist().id]">
          <sf-portrait
            class="portrait"
            [class]="'tint-' + therapist().tint"
            [src]="therapist().imageUrl"
            [alt]="therapist().name"
            [initial]="therapist().initial"
          />
        </a>
        <div class="content">
          <div class="head">
            <h2>{{ therapist().name }}</h2>
            <span class="role">{{ therapist().role }}</span>
          </div>
          <p class="bio">{{ therapist().bio }}</p>
          <div class="facts">
            <div>
              <span class="fact-label">Experience</span
              ><span>{{ therapist().experienceYears }} years</span>
            </div>
            <div class="fact-divider"></div>
            <div>
              <span class="fact-label">Qualification</span
              ><span>{{ therapist().qualification }}</span>
            </div>
          </div>
          <a class="profile-link" [routerLink]="['/therapists', therapist().id]"
            >View profile <span>→</span></a
          >
          <div class="chips">
            @for (skill of therapist().expertise; track skill) {
              <span class="chip">{{ skill }}</span>
            }
          </div>
        </div>
      </article>
    } @else {
      <a class="sf-card card sf-motion-card" [routerLink]="['/therapists', therapist().id]">
        <sf-portrait
          class="portrait compact"
          [class]="'tint-' + therapist().tint"
          [src]="therapist().imageUrl"
          [alt]="therapist().name"
          [initial]="therapist().initial"
        />
        <div class="content">
          <h3>
            {{ therapist().name }} <span class="role">{{ therapist().role }}</span>
          </h3>
        </div>
      </a>
    }
  `,
  styleUrl: './therapist-card.scss',
})
export class SfTherapistCard {
  readonly therapist = input.required<Therapist>();
  readonly full = input<boolean>(false);
}
