import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SpecialsService } from '../../../core/services/specials.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { SfSpecialCard } from '../../../shared/components/special-card/special-card';
import { SfEmptyStateAnimation } from '../../../shared/components/empty-state-animation/empty-state-animation';

@Component({
  selector: 'app-specials',
  standalone: true,
  imports: [SfSpecialCard, SfEmptyStateAnimation],
  templateUrl: './specials.html',
  styleUrl: './specials.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Specials {
  private readonly specialsSvc = inject(SpecialsService);
  private readonly therapistsSvc = inject(TherapistsService);

  readonly specials = toSignal(this.specialsSvc.listAll(), { initialValue: [] });
  readonly therapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });

  readonly visible = computed(() => this.specials().filter((s) => s.state === 'live' || s.state === 'scheduled'));

  therapistNamesFor(ids: string[]): string[] {
    const list = this.therapists();
    return ids.map((id) => list.find((t) => t.id === id)?.name).filter((v): v is string => !!v);
  }
}
