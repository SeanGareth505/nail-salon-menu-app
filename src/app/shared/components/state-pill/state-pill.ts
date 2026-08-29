import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type PillTone = 'complete' | 'flagged' | 'incomplete' | 'live' | 'ending' | 'neutral';

@Component({
  selector: 'sf-state-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="pill" [class]="'tone-' + tone()"><ng-content /></span>`,
  styles: [`
    .pill {
      display: inline-flex;
      align-items: center;
      padding: var(--sf-space-1) var(--sf-space-3);
      border-radius: var(--sf-radius-pill);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .tone-complete { background: var(--sf-status-complete-bg); color: var(--sf-status-complete-fg); }
    .tone-flagged { background: var(--sf-status-flagged-bg); color: var(--sf-status-flagged-fg); }
    .tone-incomplete { background: var(--sf-status-incomplete-bg); color: var(--sf-status-incomplete-fg); }
    .tone-live { background: var(--sf-status-live-bg); color: var(--sf-status-live-fg); }
    .tone-ending { background: var(--sf-status-ending-bg); color: var(--sf-status-ending-fg); }
    .tone-neutral { background: var(--sf-sand); color: var(--sf-ink-muted); }
  `],
})
export class SfStatePill {
  readonly tone = input<PillTone>('neutral');
}
