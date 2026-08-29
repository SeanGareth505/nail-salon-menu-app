import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type InfoTone = 'sky' | 'sand' | 'warning';

@Component({
  selector: 'sf-info-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="block" [class]="'tone-' + tone()">
      @if (title()) { <p class="sf-eyebrow">{{ title() }}</p> }
      <ng-content />
    </div>
  `,
  styles: [`
    .block { border-radius: var(--sf-radius-md); padding: var(--sf-space-4); }
    .tone-sky { background: var(--sf-sky); }
    .tone-sand { background: var(--sf-sand); }
    .tone-warning { background: var(--sf-champagne-light); border-left: 3px solid var(--sf-champagne); }
    ::ng-content ul { margin: var(--sf-space-2) 0 0; padding-left: 1.1em; }
  `],
})
export class SfInfoBlock {
  readonly title = input<string>('');
  readonly tone = input<InfoTone>('sky');
}
