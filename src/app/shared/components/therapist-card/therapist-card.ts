import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Therapist } from '../../../core/models';

@Component({
  selector: 'sf-therapist-card',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (full()) {
      <article class="profile">
        <a class="portrait-link" [routerLink]="['/therapists', therapist().id]">
          <div class="portrait" [class]="'tint-' + therapist().tint">
            <div class="portrait-frame"></div>
            <span class="initial">{{ therapist().initial }}</span>
          </div>
        </a>
        <div class="content">
          <div class="head">
            <h2>{{ therapist().name }}</h2>
            <span class="role">{{ therapist().role }}</span>
          </div>
          <p class="bio">{{ therapist().bio }}</p>
          <div class="facts">
            <div><span class="fact-label">Experience</span><span>{{ therapist().experienceYears }} years</span></div>
            <div class="fact-divider"></div>
            <div><span class="fact-label">Qualification</span><span>{{ therapist().qualification }}</span></div>
          </div>
          <div class="chips">
            @for (skill of therapist().expertise; track skill) { <span class="chip">{{ skill }}</span> }
          </div>
        </div>
      </article>
    } @else {
      <a class="sf-card card sf-motion-card" [routerLink]="['/therapists', therapist().id]">
        <div class="portrait compact" [class]="'tint-' + therapist().tint">
          <span class="initial">{{ therapist().initial }}</span>
        </div>
        <div class="content">
          <h3>{{ therapist().name }} <span class="role">{{ therapist().role }}</span></h3>
        </div>
      </a>
    }
  `,
  styles: [`
    .profile { margin-bottom: 36px; animation: sf-motion-rise-in var(--sf-dur-normal) var(--sf-ease-enter) both; }
    .portrait-link { display: block; text-decoration: none; color: inherit; }
    .portrait {
      position: relative;
      height: 300px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .portrait-frame {
      position: absolute;
      inset: 18px;
      border: 1px solid rgba(201, 169, 110, 0.4);
      pointer-events: none;
    }
    .tint-blush { background: var(--sf-blush); }
    .tint-sage { background: var(--sf-sage-light); }
    .tint-sky { background: var(--sf-sky); }
    .tint-sand { background: var(--sf-sand); }
    .initial { font-family: var(--sf-font-display); font-size: 6rem; color: rgba(74, 107, 87, 0.42); position: relative; z-index: 1; }
    .head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
    h2 { margin: 0; font-size: 1.5rem; font-weight: 400; }
    .role { font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sf-sage); font-weight: 400; font-family: var(--sf-font-body); }
    .bio { color: rgba(51, 51, 51, 0.7); font-weight: 300; line-height: 1.7; margin: 0; }
    .facts { display: flex; gap: 26px; margin-top: 16px; padding: 14px 0; border-top: 1px solid rgba(74, 107, 87, 0.12); border-bottom: 1px solid rgba(74, 107, 87, 0.12); }
    .facts > div { display: flex; flex-direction: column; gap: 7px; }
    .fact-label { font-size: 0.66rem; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(51, 51, 51, 0.42); }
    .fact-divider { width: 1px; background: rgba(74, 107, 87, 0.13); }
    .chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 14px; }
    .chip { background: var(--sf-sage-light); color: var(--sf-forest); font-size: 0.75rem; padding: 9px 13px; border-radius: var(--sf-radius-pill); }

    .card { display: block; text-decoration: none; color: inherit; overflow: hidden; margin-bottom: var(--sf-space-5); }
    .portrait.compact { aspect-ratio: 1.1; display: flex; align-items: center; justify-content: center; }
    .portrait.compact .initial { font-size: 5rem; opacity: 0.55; color: var(--sf-forest); }
    .card .content { padding: var(--sf-space-4); }
    .card h3 { display: flex; flex-direction: column; gap: 2px; font-size: 1.3rem; font-weight: 400; }
    .card .role { font-family: var(--sf-font-body); font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sf-champagne); font-weight: 600; }
  `],
})
export class SfTherapistCard {
  readonly therapist = input.required<Therapist>();
  readonly full = input<boolean>(false);
}
