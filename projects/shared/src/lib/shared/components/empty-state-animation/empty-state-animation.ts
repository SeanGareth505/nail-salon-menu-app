import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SfIcon } from '../icon/icon';

export type EmptyMotif = 'treatments' | 'specials' | 'consultations' | 'clients' | 'search' | 'generic';

const MOTIF_ICONS: Record<EmptyMotif, string> = {
  treatments: 'treatments',
  specials: 'specials',
  consultations: 'records',
  clients: 'clients',
  search: 'search',
  generic: 'leaf',
};

@Component({
  selector: 'sf-empty-state-animation',
  standalone: true,
  imports: [SfIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state-animation.html',
  styleUrls: ['./empty-state-animation.scss', '../../styles/empty-motif.scss'],
})
export class SfEmptyStateAnimation {
  readonly motif = input<EmptyMotif>('generic');
  readonly title = input('Nothing here yet');
  readonly message = input('');

  readonly iconName = computed(() => MOTIF_ICONS[this.motif()]);
}
