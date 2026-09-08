import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sf-stat-tile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tile">
      <span class="label">{{ label() }}</span>
      <span class="value" [style.color]="accent() || null">{{ value() }}</span>
      @if (hint()) {
        <span class="hint">{{ hint() }}</span>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .tile {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 22px;
        border: 1px solid var(--sf-border);
        border-radius: 12px;
        background: var(--sf-surface);
      }
      .label {
        font-size: 12px;
        font-weight: 500;
        color: var(--sf-ink-muted);
        line-height: 1.5;
      }
      .value {
        font: 600 32px/1.2 var(--sf-font-body);
        letter-spacing: -1px;
        color: var(--sf-ink);
        margin-top: 12px;
      }
      .hint {
        font-size: 12px;
        line-height: 1.6;
        color: var(--sf-ink-muted);
        margin-top: 10px;
      }
      @media (max-width: 767px) {
        .tile {
          padding: 18px;
        }
        .value {
          font-size: 29px;
        }
      }
    `,
  ],
})
export class SfStatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>('');
  readonly accent = input<string>('');
}
