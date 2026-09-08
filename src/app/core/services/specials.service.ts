import { inject, Injectable } from '@angular/core';
import { orderBy } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { Special, Treatment } from '../models';
import {
  computeOriginalPrice,
  computeSpecialPrice,
  getTreatmentSpecialView,
  normalizeSpecial,
  todayIso,
} from '../specials/special-pricing.util';
import { FirestoreBaseRepository } from './firestore-base.repository';
import { TreatmentsService } from './treatments.service';

export type SpecialSaveInput = Omit<Special, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>;

@Injectable({ providedIn: 'root' })
export class SpecialsService extends FirestoreBaseRepository<Special> {
  private readonly treatmentsSvc = inject(TreatmentsService);

  protected readonly path = 'specials';

  listAll() {
    return this.list(orderBy('endsAt', 'asc'));
  }

  async saveSpecial(input: Partial<Special> & { id?: string }, asDraft = false): Promise<string> {
    const normalized = normalizeSpecial(input);
    const treatments = await firstValueFrom(this.treatmentsSvc.listAll());
    const payload = this.buildPayload(normalized, treatments, asDraft);

    let id = input.id;
    if (id) {
      await this.update(id, payload as Partial<Special>);
    } else {
      id = await this.create(payload as Omit<Special, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>);
    }

    await this.reconcileTreatmentFlags();
    return id;
  }

  async deleteSpecial(id: string): Promise<void> {
    await this.remove(id);
    await this.reconcileTreatmentFlags();
  }

  async endNow(id: string): Promise<void> {
    const today = todayIso();
    await this.update(id, { endsAt: today, isDraft: false } as Partial<Special>);
    await this.reconcileTreatmentFlags();
  }

  async duplicateSpecial(source: Special): Promise<string> {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const weekAfter = new Date(nextWeek);
    weekAfter.setDate(weekAfter.getDate() + 7);

    const copy = normalizeSpecial({
      ...source,
      id: undefined,
      title: `${source.title} (copy)`,
      startsAt: nextWeek.toISOString().slice(0, 10),
      endsAt: weekAfter.toISOString().slice(0, 10),
      isDraft: true,
    });
    delete (copy as Partial<Special>).id;
    return this.saveSpecial(copy, true);
  }

  async reconcileTreatmentFlags(): Promise<void> {
    const [specials, treatments] = await Promise.all([
      firstValueFrom(this.listAll()),
      firstValueFrom(this.treatmentsSvc.listAll()),
    ]);
    const normalized = specials.map((s) => normalizeSpecial(s));
    const today = new Date();

    for (const treatment of treatments) {
      const view = getTreatmentSpecialView(treatment.id, normalized, treatments, today);
      const onSpecial = view !== null;
      const specialId = view?.specialId ?? null;
      if (treatment.onSpecial !== onSpecial || (treatment.specialId ?? null) !== specialId) {
        await this.treatmentsSvc.update(treatment.id, { onSpecial, specialId } as Partial<Treatment>);
      }
    }
  }

  private buildPayload(normalized: Special, treatments: Treatment[], asDraft: boolean): Partial<Special> {
    const treatmentIds = normalized.kind === 'promo' ? [] : [...normalized.treatmentIds];
    const originalPrice = normalized.kind === 'promo'
      ? normalized.originalPrice
      : computeOriginalPrice({ ...normalized, treatmentIds }, treatments);

    let price = normalized.price;
    if (normalized.kind === 'single' && treatmentIds.length === 1) {
      const treatment = treatments.find((t) => t.id === treatmentIds[0]);
      if (treatment && normalized.discountType !== 'fixed') {
        price = computeSpecialPrice(normalized, treatment.price);
      }
    }

    return {
      kind: normalized.kind,
      title: normalized.title.trim(),
      scriptTitle: normalized.scriptTitle.trim(),
      description: normalized.description.trim(),
      treatmentIds,
      discountType: normalized.kind === 'single' ? normalized.discountType : 'fixed',
      price,
      originalPrice,
      percentOff: normalized.discountType === 'percent' ? normalized.percentOff : null,
      amountOff: normalized.discountType === 'amount' ? normalized.amountOff : null,
      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      therapistIds: normalized.therapistIds,
      finePrint: normalized.finePrint.trim(),
      isDraft: asDraft,
      sortOrder: normalized.sortOrder,
      featured: normalized.featured,
      treatmentId: null,
      state: undefined,
    };
  }
}
