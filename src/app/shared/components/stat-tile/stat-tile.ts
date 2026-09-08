import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sf-stat-tile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tile">
      <span class="label">{{ label() }}</span>
      <span class="value" [style.color]="accent() || null">{{ value() }}</span>
      @if (hint()) { <span class="hint">{{ hint() }}</span> }
    </div>
  `,
  styles: [`
    .tile { display: flex; flex-direction: column; gap: 0; padding: 18px 20px; }
    .label {
      font-size: 0.625rem;
      font-weight: 400;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      color: rgba(51, 51, 51, 0.45);
      min-height: 26px;
      line-height: 1.3;
    }
    .value {
      font-family: var(--sf-font-display);
      font-size: 2rem;
      font-weight: 400;
      color: var(--sf-ink);
      line-height: 1;
      margin-top: 10px;
    }
    .hint {
      font-size: 0.72rem;
      font-weight: 300;
      color: rgba(51, 51, 51, 0.5);
      margin-top: 8px;
    }
    @media (min-width: 768px) {
      .value { font-size: 1.875rem; margin-top: 10px; }
    }
    @media (min-width: 1100px) {
      .value { font-size: 2rem; }
    }
  `],
})
export class SfStatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>('');
  readonly accent = input<string>('');
}
