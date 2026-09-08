import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { Special, SpecialDiscountType, SpecialKind, Treatment } from '@core/models';
import { SpecialsService } from '@core/services/specials.service';
import { TherapistsService } from '@core/services/therapists.service';
import { TreatmentsService } from '@core/services/treatments.service';
import {
  computeOriginalPrice,
  computeSpecialPrice,
  displayStateLabel,
  formatDateLabel,
  isEndingSoon,
  normalizeSpecial,
  resolveDisplayState,
  resolveEffectiveState,
  schedulePreview,
  todayIso,
  validateSpecial,
} from '@core/specials/special-pricing.util';
import { formatRand } from '@core/utils/format-rand.util';
import { SfSpecialCard } from '@shared/components/special-card/special-card';
import { FormatRandPipe } from '@shared/pipes/format-rand.pipe';
import { SfPageActionDirective } from '@shared/directives/page-action.directive';

type Draft = Partial<Special>;
type AdminFilter = 'all' | 'draft' | 'scheduled' | 'live' | 'expired';

@Component({
  selector: 'app-specials',
  standalone: true,
  imports: [FormsModule, SfSpecialCard, FormatRandPipe, SfPageActionDirective],
  templateUrl: './specials.html',
  styleUrl: './specials.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Specials {
  private readonly specialsSvc = inject(SpecialsService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly therapistsSvc = inject(TherapistsService);

  readonly pageAction = (): void => this.startNew();

  readonly specials = toSignal(
    this.specialsSvc.listAll().pipe(map((items) => items.map((s) => normalizeSpecial(s)))),
    { initialValue: [] as Special[] },
  );
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] as Treatment[] });
  readonly therapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });

  readonly editing = signal<Draft | null>(null);
  readonly isNew = signal(false);
  readonly saveAsDraft = signal(false);
  readonly formErrors = signal<string[]>([]);
  readonly filter = signal<AdminFilter>('all');

  readonly kinds: SpecialKind[] = ['single', 'bundle', 'promo'];
  readonly discountTypes: SpecialDiscountType[] = ['fixed', 'percent', 'amount'];

  readonly filtered = computed(() => {
    const f = this.filter();
    if (f === 'all') return this.specials();
    return this.specials().filter((s) => resolveEffectiveState(s) === f);
  });

  readonly lifecycleFilters = computed(() => {
    const items = this.specials();
    const count = (f: AdminFilter) => {
      if (f === 'all') return items.length;
      if (f === 'live') {
        return items.filter((s) => resolveEffectiveState(s) === 'live').length;
      }
      return items.filter((s) => resolveEffectiveState(s) === f).length;
    };
    return [
      { id: 'all' as const, label: 'All', count: count('all') },
      { id: 'live' as const, label: 'Live', count: count('live') },
      { id: 'scheduled' as const, label: 'Scheduled', count: count('scheduled') },
      { id: 'draft' as const, label: 'Draft', count: count('draft') },
      { id: 'expired' as const, label: 'Expired', count: count('expired') },
    ];
  });

  readonly previewSpecial = computed(() => {
    const d = this.editing();
    if (!d) return null;
    const normalized = normalizeSpecial(d);
    const original = computeOriginalPrice(normalized, this.treatments());
    let price = normalized.price;
    if (normalized.kind === 'single' && normalized.treatmentIds.length === 1) {
      const treatment = this.treatments().find((t) => t.id === normalized.treatmentIds[0]);
      if (treatment) price = computeSpecialPrice(normalized, treatment.price);
    }
    return normalizeSpecial({ ...normalized, originalPrice: original, price });
  });

  readonly scheduleLine = computed(() => {
    const d = this.editing();
    if (!d) return '';
    return schedulePreview(normalizeSpecial({ ...d, isDraft: this.saveAsDraft() }));
  });

  readonly computedOriginal = computed(() => {
    const d = this.editing();
    if (!d) return 0;
    return computeOriginalPrice(normalizeSpecial(d), this.treatments());
  });

  readonly computedPrice = computed(() => {
    const d = this.editing();
    if (!d || d.kind !== 'single' || !d.treatmentIds?.length) return d?.price ?? 0;
    const treatment = this.treatments().find((t) => t.id === d.treatmentIds![0]);
    if (!treatment) return d.price ?? 0;
    return computeSpecialPrice(normalizeSpecial(d), treatment.price);
  });

  startNew(): void {
    this.isNew.set(true);
    this.saveAsDraft.set(false);
    this.formErrors.set([]);
    const today = todayIso();
    this.editing.set({
      kind: 'single',
      title: '',
      scriptTitle: '',
      treatmentIds: [],
      description: '',
      price: 0,
      originalPrice: 0,
      discountType: 'fixed',
      percentOff: null,
      amountOff: null,
      startsAt: today,
      endsAt: today,
      therapistIds: [],
      finePrint: 'One per client. Cannot be combined with other offers.',
      isDraft: false,
      sortOrder: this.specials().length,
      featured: false,
    });
  }

  edit(s: Special): void {
    this.isNew.set(false);
    this.saveAsDraft.set(s.isDraft);
    this.formErrors.set([]);
    this.editing.set({ ...normalizeSpecial(s) });
  }

  cancel(): void {
    this.editing.set(null);
    this.formErrors.set([]);
  }

  setKind(kind: SpecialKind): void {
    this.editing.update((d) => {
      if (!d) return d;
      const treatmentIds = kind === 'promo' ? [] : d.treatmentIds ?? [];
      return { ...d, kind, treatmentIds };
    });
  }

  toggleTreatment(id: string): void {
    this.editing.update((d) => {
      if (!d) return d;
      const ids = new Set(d.treatmentIds ?? []);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      let treatmentIds = [...ids];
      if (d.kind === 'single') treatmentIds = treatmentIds.slice(-1);
      return { ...d, treatmentIds };
    });
  }

  toggleTherapist(id: string): void {
    this.editing.update((d) => {
      if (!d) return d;
      const ids = new Set(d.therapistIds ?? []);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      return { ...d, therapistIds: [...ids] };
    });
  }

  isTreatmentSelected(id: string): boolean {
    return (this.editing()?.treatmentIds ?? []).includes(id);
  }

  isTherapistSelected(id: string): boolean {
    return (this.editing()?.therapistIds ?? []).includes(id);
  }

  applyPreset(preset: 'this-week' | 'next-week' | 'this-month'): void {
    const today = startOfDay(new Date());
    let start = new Date(today);
    let end = new Date(today);
    if (preset === 'this-week') {
      end.setDate(start.getDate() + 6);
    } else if (preset === 'next-week') {
      start.setDate(start.getDate() + 7);
      end.setDate(start.getDate() + 6);
    } else {
      end.setMonth(start.getMonth() + 1);
    }
    this.editing.update((d) => d ? {
      ...d,
      startsAt: start.toISOString().slice(0, 10),
      endsAt: end.toISOString().slice(0, 10),
    } : d);
  }

  async save(): Promise<void> {
    const d = this.editing();
    if (!d) return;
    const validation = validateSpecial(d, this.treatments(), this.saveAsDraft());
    if (!validation.valid) {
      this.formErrors.set(validation.errors);
      return;
    }
    this.formErrors.set([]);
    await this.specialsSvc.saveSpecial(d, this.saveAsDraft());
    this.editing.set(null);
  }

  async remove(s: Special): Promise<void> {
    if (!confirm(`Remove "${s.title}"?`)) return;
    await this.specialsSvc.deleteSpecial(s.id);
  }

  async endNow(s: Special): Promise<void> {
    if (!confirm(`End "${s.title}" now?`)) return;
    await this.specialsSvc.endNow(s.id);
  }

  async duplicate(s: Special): Promise<void> {
    await this.specialsSvc.duplicateSpecial(s);
  }

  stateLabel(s: Special): string {
    return displayStateLabel(resolveDisplayState(s));
  }

  stateClass(s: Special): string {
    const display = resolveDisplayState(s);
    if (display === 'ending-soon') return 'state-ending-soon';
    return `state-${display}`;
  }

  rowTint(index: number): string {
    const tints = ['sage', 'blush', 'sky', 'sand'];
    return tints[index % tints.length];
  }

  effectiveStateFor(s: Special): ReturnType<typeof resolveEffectiveState> {
    return resolveEffectiveState(s);
  }

  stateHint(s: Special): string {
    const state = resolveEffectiveState(s);
    if (state === 'scheduled') {
      const days = Math.max(0, Math.round((parseSpecialDate(s.startsAt).getTime() - startOfDay(new Date()).getTime()) / 86400000));
      return `Starts in ${days} day${days === 1 ? '' : 's'}`;
    }
    return `${formatDateLabel(s.startsAt)} – ${formatDateLabel(s.endsAt)}`;
  }

  treatmentSummary(s: Special): string {
    if (!s.treatmentIds.length) return '—';
    const names = s.treatmentIds
      .map((id) => this.treatments().find((t) => t.id === id)?.name)
      .filter((v): v is string => !!v);
    return names.length ? names.join(', ') : `${s.treatmentIds.length} treatments`;
  }

  therapistNamesFor(ids: string[]): string[] {
    return ids.map((id) => this.therapists().find((t) => t.id === id)?.name).filter((v): v is string => !!v);
  }

  treatmentNamesFor(ids: string[]): string[] {
    return ids.map((id) => this.treatments().find((t) => t.id === id)?.name).filter((v): v is string => !!v);
  }

  kindLabel(kind: SpecialKind): string {
    switch (kind) {
      case 'single': return 'Single';
      case 'bundle': return 'Bundle';
      case 'promo': return 'Promotional';
      default: {
        const _exhaustive: never = kind;
        return _exhaustive;
      }
    }
  }

  discountLabel(s: Special): string {
    if (s.kind === 'promo') return 'No pricing';
    switch (s.discountType) {
      case 'fixed': return 'Fixed price';
      case 'percent': return 'Percent off';
      case 'amount': return 'Amount off';
      default: return 'Discount';
    }
  }

  pricingLabel(s: Special): string {
    const normalized = normalizeSpecial(s);
    const original = computeOriginalPrice(normalized, this.treatments());
    if (s.kind === 'promo') return 'Non-pricing offer';
    if (original > s.price) {
      return `${formatRand(original)} → ${formatRand(s.price)}`;
    }
    if (s.discountType === 'percent' && s.percentOff) {
      return `${formatRand(original)} − ${s.percentOff}%`;
    }
    if (s.discountType === 'amount' && s.amountOff) {
      return `${formatRand(original)} − ${formatRand(s.amountOff)}`;
    }
    return formatRand(s.price);
  }

  appliesLabel(s: Special): string {
    const treatmentPart = this.treatmentSummary(s);
    const therapists = this.therapistNamesFor(s.therapistIds ?? []);
    const therapistPart = therapists.length ? therapists.join(', ') : 'all therapists';
    if (treatmentPart === '—') return therapistPart;
    return `${s.treatmentIds.length} treatment${s.treatmentIds.length === 1 ? '' : 's'} · ${therapistPart}`;
  }

  rowActionLabel(s: Special): string {
    if (isEndingSoon(s)) return 'Extend';
    const state = resolveEffectiveState(s);
    switch (state) {
      case 'live': return 'End now';
      case 'scheduled': return 'Go live now';
      case 'draft': return 'Publish';
      case 'expired': return 'Duplicate';
      default: return 'Edit';
    }
  }

  rowActionPrimary(s: Special): boolean {
    const state = resolveEffectiveState(s);
    return state === 'draft' || state === 'scheduled';
  }

  async rowAction(s: Special): Promise<void> {
    if (isEndingSoon(s)) {
      this.edit(s);
      return;
    }
    const state = resolveEffectiveState(s);
    if (state === 'live') await this.endNow(s);
    else if (state === 'expired') await this.duplicate(s);
    else this.edit(s);
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseSpecialDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
