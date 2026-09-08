import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type PillTone = 'complete' | 'flagged' | 'incomplete' | 'review' | 'live' | 'ending' | 'upcoming' | 'neutral';

@Component({
  selector: 'sf-state-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="pill" [class]="'tone-' + tone()"><ng-content /></span>`,
  styles: [`
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 0.62rem;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
      line-height: 1;
    }
    .tone-complete { background: var(--sf-status-complete-bg); color: var(--sf-status-complete-fg); }
    .tone-flagged { background: var(--sf-status-flagged-bg); color: var(--sf-status-flagged-fg); }
    .tone-incomplete { background: var(--sf-status-incomplete-bg); color: var(--sf-status-incomplete-fg); }
    .tone-review { background: var(--sf-sky); color: var(--sf-sky-fg); }
    .tone-live { background: var(--sf-status-live-bg); color: var(--sf-status-live-fg); }
    .tone-ending { background: var(--sf-status-ending-bg); color: var(--sf-status-ending-fg); }
    .tone-upcoming { background: var(--sf-status-upcoming-bg); color: var(--sf-status-upcoming-fg); }
    .tone-neutral { background: var(--sf-sand); color: var(--sf-ink-muted); }
  `],
})
export class SfStatePill {
  readonly tone = input<PillTone>('neutral');
}
