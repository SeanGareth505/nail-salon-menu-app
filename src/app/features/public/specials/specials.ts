import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SpecialPricingService } from '../../../core/services/special-pricing.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { Special } from '../../../core/models';
import { parseSpecialDate, resolveEffectiveState } from '../../../core/specials/special-pricing.util';
import { SfSpecialRow } from '../../../shared/components/special-row/special-row';
import { SfEmptyStateAnimation } from '../../../shared/components/empty-state-animation/empty-state-animation';

@Component({
  selector: 'app-specials',
  standalone: true,
  imports: [SfSpecialRow, SfEmptyStateAnimation],
  templateUrl: './specials.html',
  styleUrl: './specials.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Specials {
  private readonly pricingSvc = inject(SpecialPricingService);
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly treatmentsSvc = inject(TreatmentsService);

  readonly therapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });

  readonly currentSpecials = computed(() =>
    this.pricingSvc
      .publicSpecials()
      .filter((s) => resolveEffectiveState(s) === 'live')
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.sortOrder - b.sortOrder;
      }),
  );

  readonly upcomingSpecials = computed(() =>
    this.pricingSvc
      .publicSpecials()
      .filter((s) => resolveEffectiveState(s) === 'scheduled')
      .sort((a, b) => parseSpecialDate(a.startsAt).getTime() - parseSpecialDate(b.startsAt).getTime()),
  );

  readonly hasAny = computed(() => this.currentSpecials().length > 0 || this.upcomingSpecials().length > 0);

  therapistNamesFor(ids: string[]): string[] {
    const list = this.therapists();
    return ids.map((id) => list.find((t) => t.id === id)?.name).filter((v): v is string => !!v);
  }

  treatmentNamesFor(ids: string[]): string[] {
    const list = this.treatments();
    return ids.map((id) => list.find((t) => t.id === id)?.name).filter((v): v is string => !!v);
  }

  effectiveStateFor(special: Special) {
    return resolveEffectiveState(special);
  }
}
