import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SfIcon } from '../icon/icon';

const MOTIF_ICONS: Record<string, string> = {
  specials: 'specials',
  treatments: 'treatments',
  droplet: 'droplet',
  records: 'records',
  calendar: 'calendar',
  clients: 'clients',
  team: 'team',
  search: 'search',
  check: 'check',
};

@Component({
  selector: 'sf-empty-state',
  standalone: true,
  imports: [SfIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <div class="empty-motif" aria-hidden="true">
        <span class="empty-motif__ring"></span>
        <sf-icon [name]="iconName()" [size]="44" />
      </div>
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styleUrls: ['../../styles/empty-motif.scss'],
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--sf-space-2);
      padding: var(--sf-space-5) var(--sf-space-4);
      color: var(--sf-ink-muted);
      border: 1px solid rgba(201, 169, 110, 0.4);
      border-radius: var(--sf-radius-sm);
      background: var(--sf-surface);
    }
    h3 {
      color: var(--sf-ink);
      font-size: 1.1rem;
      font-family: var(--sf-font-display);
      margin: 0;
    }
    p { max-width: 34ch; margin: 0; line-height: 1.55; }
  `],
})
export class SfEmptyState {
  readonly icon = input<string>('search');
  readonly title = input<string>('Nothing here yet');
  readonly message = input<string>('');

  readonly iconName = computed(() => MOTIF_ICONS[this.icon()] ?? 'leaf');
}
