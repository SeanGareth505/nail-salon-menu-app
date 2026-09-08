import { Injectable, computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Special, Treatment } from '../models';
import {
  computeOriginalPrice,
  computeSpecialPrice,
  getFeaturedSpecial,
  getPublicSpecials,
  getTreatmentSpecialView,
  isOnSpecialFilter,
  normalizeSpecial,
  resolveEffectiveState,
  TreatmentSpecialView,
} from '../specials/special-pricing.util';
import { SpecialsService } from '../services/specials.service';
import { TreatmentsService } from '../services/treatments.service';

@Injectable({ providedIn: 'root' })
export class SpecialPricingService {
  private readonly specialsSvc = inject(SpecialsService);
  private readonly treatmentsSvc = inject(TreatmentsService);

  readonly specials = toSignal(
    this.specialsSvc.listAll().pipe(map((items) => items.map((s) => normalizeSpecial(s)))),
    { initialValue: [] as Special[] },
  );

  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] as Treatment[] });

  readonly publicSpecials = computed(() => getPublicSpecials(this.specials()));

  readonly featuredSpecial = computed(() => getFeaturedSpecial(this.specials()));

  effectiveState(special: Special, today: Date = new Date()): ReturnType<typeof resolveEffectiveState> {
    return resolveEffectiveState(special, today);
  }

  getTreatmentView(treatmentId: string): TreatmentSpecialView | null {
    return getTreatmentSpecialView(treatmentId, this.specials(), this.treatments());
  }

  isOnSpecialFilter(treatmentId: string): boolean {
    return isOnSpecialFilter(treatmentId, this.specials());
  }

  computeOriginalPrice(special: Special, treatments?: Treatment[]): number {
    return computeOriginalPrice(special, treatments ?? this.treatments());
  }

  computeSpecialPrice(special: Special, treatmentPrice: number): number {
    return computeSpecialPrice(special, treatmentPrice);
  }

  specialsByState(state: ReturnType<typeof resolveEffectiveState>): Signal<Special[]> {
    return computed(() => this.specials().filter((s) => resolveEffectiveState(s) === state));
  }
}
