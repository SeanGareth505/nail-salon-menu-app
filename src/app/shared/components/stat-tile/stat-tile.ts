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
    .tile { display: flex; flex-direction: column; gap: 0; padding: 20px 24px; }
    .label {
      font-size: 0.66rem;
      font-weight: 400;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(51, 51, 51, 0.45);
      min-height: 26px;
    }
    .value {
      font-family: var(--sf-font-display);
      font-size: 2.375rem;
      font-weight: 400;
      color: var(--sf-ink);
      line-height: 1;
      margin-top: 14px;
    }
    .hint {
      font-size: 0.75rem;
      font-weight: 300;
      color: rgba(51, 51, 51, 0.5);
      margin-top: 9px;
    }
  `],
})
export class SfStatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>('');
  readonly accent = input<string>('');
}
