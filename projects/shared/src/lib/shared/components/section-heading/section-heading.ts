import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sf-section-heading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (script()) { <p class="sf-script script">{{ script() }}</p> }
    <h2>{{ title() }}</h2>
    @if (subtitle()) { <p class="subtitle">{{ subtitle() }}</p> }
  `,
  styles: [`
    :host { display: block; margin-bottom: var(--sf-space-4); }
    .script { font-size: 1.4rem; margin: 0 0 2px; }
    h2 { font-size: 1.5rem; }
    .subtitle { color: var(--sf-ink-muted); margin: 0; }
  `],
})
export class SfSectionHeading {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly script = input<string>('');
}
