import { Special, SpecialDiscountType, SpecialKind, SpecialState, Treatment } from '../models';

export interface TreatmentSpecialView {
  specialId: string;
  kind: 'single' | 'bundle';
  badge: 'special' | 'bundle';
  displayPrice: number | null;
  originalPrice: number | null;
  specialTitle: string;
}

export function parseSpecialDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function todayIso(): string {
  return startOfDay(new Date()).toISOString().slice(0, 10);
}

export function normalizeSpecial(raw: Partial<Special> & { id?: string }): Special {
  const treatmentIds = raw.treatmentIds?.length
    ? [...raw.treatmentIds]
    : raw.treatmentId
      ? [raw.treatmentId]
      : [];

  let kind: SpecialKind = raw.kind ?? 'promo';
  if (!raw.kind) {
    if (treatmentIds.length >= 2) kind = 'bundle';
    else if (treatmentIds.length === 1) kind = 'single';
    else kind = 'promo';
  }

  const isDraft = raw.isDraft ?? raw.state === 'draft';

  return {
    id: raw.id ?? '',
    kind,
    title: raw.title ?? '',
    scriptTitle: raw.scriptTitle ?? '',
    description: raw.description ?? '',
    treatmentIds,
    discountType: raw.discountType ?? 'fixed',
    price: raw.price ?? 0,
    originalPrice: raw.originalPrice ?? 0,
    percentOff: raw.percentOff ?? null,
    amountOff: raw.amountOff ?? null,
    startsAt: raw.startsAt ?? todayIso(),
    endsAt: raw.endsAt ?? todayIso(),
    therapistIds: raw.therapistIds ?? [],
    finePrint: raw.finePrint ?? '',
    isDraft,
    sortOrder: raw.sortOrder ?? 0,
    featured: raw.featured ?? false,
    treatmentId: raw.treatmentId ?? null,
    state: raw.state,
    createdAt: raw.createdAt ?? null,
    createdBy: raw.createdBy ?? null,
    updatedAt: raw.updatedAt ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}

export const ENDING_SOON_DAYS = 7;

export function resolveEffectiveState(special: Special, today: Date = new Date()): SpecialState {
  if (special.isDraft) return 'draft';
  const start = startOfDay(parseSpecialDate(special.startsAt));
  const end = startOfDay(parseSpecialDate(special.endsAt));
  const now = startOfDay(today);
  if (now < start) return 'scheduled';
  if (now > end) return 'expired';
  return 'live';
}

export type SpecialDisplayState = SpecialState | 'ending-soon';

export function isEndingSoon(special: Special, today: Date = new Date()): boolean {
  if (resolveEffectiveState(special, today) !== 'live') return false;
  const daysLeft = daysUntil(special.endsAt, today);
  return daysLeft >= 0 && daysLeft <= ENDING_SOON_DAYS;
}

export function resolveDisplayState(special: Special, today: Date = new Date()): SpecialDisplayState {
  if (isEndingSoon(special, today)) return 'ending-soon';
  return resolveEffectiveState(special, today);
}

export function computeOriginalPrice(special: Special, treatments: Treatment[]): number {
  if (special.kind === 'promo') return special.originalPrice;
  const selected = treatments.filter((t) => special.treatmentIds.includes(t.id));
  return selected.reduce((sum, t) => sum + t.price, 0);
}

export function computeSpecialPrice(
  special: Special,
  treatmentPrice: number,
  discountType: SpecialDiscountType = special.discountType,
): number {
  switch (discountType) {
    case 'percent': {
      const pct = special.percentOff ?? 0;
      return Math.max(0, Math.round(treatmentPrice * (1 - pct / 100)));
    }
    case 'amount': {
      const off = special.amountOff ?? 0;
      return Math.max(0, treatmentPrice - off);
    }
    default:
      return special.price;
  }
}

export function compareSpecialPriority(a: Special, b: Special): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  const endA = parseSpecialDate(a.endsAt).getTime();
  const endB = parseSpecialDate(b.endsAt).getTime();
  if (endA !== endB) return endA - endB;
  return a.price - b.price;
}

export function pickWinningSingleSpecial(specials: Special[]): Special | null {
  if (!specials.length) return null;
  return [...specials].sort(compareSpecialPriority)[0];
}

export function getTreatmentSpecialView(
  treatmentId: string,
  specials: Special[],
  treatments: Treatment[],
  today: Date = new Date(),
): TreatmentSpecialView | null {
  const live = specials.filter((s) => resolveEffectiveState(s, today) === 'live');

  const singles = live.filter((s) => s.kind === 'single' && s.treatmentIds.includes(treatmentId));
  const winner = pickWinningSingleSpecial(singles);
  if (winner) {
    const treatment = treatments.find((t) => t.id === treatmentId);
    const original = treatment?.price ?? winner.originalPrice;
    return {
      specialId: winner.id,
      kind: 'single',
      badge: 'special',
      displayPrice: computeSpecialPrice(winner, original),
      originalPrice: original,
      specialTitle: winner.title,
    };
  }

  const bundle = live.find((s) => s.kind === 'bundle' && s.treatmentIds.includes(treatmentId));
  if (bundle) {
    return {
      specialId: bundle.id,
      kind: 'bundle',
      badge: 'bundle',
      displayPrice: null,
      originalPrice: null,
      specialTitle: bundle.title,
    };
  }

  return null;
}

export function isOnSpecialFilter(
  treatmentId: string,
  specials: Special[],
  today: Date = new Date(),
): boolean {
  return specials.some((s) => {
    if (resolveEffectiveState(s, today) !== 'live') return false;
    return s.treatmentIds.includes(treatmentId);
  });
}

export function getPublicSpecials(specials: Special[], today: Date = new Date()): Special[] {
  return specials
    .filter((s) => {
      const state = resolveEffectiveState(s, today);
      return state === 'live' || state === 'scheduled';
    })
    .sort((a, b) => {
      const stateA = resolveEffectiveState(a, today);
      const stateB = resolveEffectiveState(b, today);
      if (stateA !== stateB) {
        if (stateA === 'scheduled' && stateB === 'live') return -1;
        if (stateA === 'live' && stateB === 'scheduled') return 1;
      }
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return parseSpecialDate(a.startsAt).getTime() - parseSpecialDate(b.startsAt).getTime();
    });
}

export function getFeaturedSpecial(specials: Special[], today: Date = new Date()): Special | null {
  const publicSpecials = getPublicSpecials(specials, today);
  const featuredLive = publicSpecials.find((s) => s.featured && resolveEffectiveState(s, today) === 'live');
  if (featuredLive) return featuredLive;
  const featuredUpcoming = publicSpecials.find((s) => s.featured && resolveEffectiveState(s, today) === 'scheduled');
  if (featuredUpcoming) return featuredUpcoming;
  const live = publicSpecials.find((s) => resolveEffectiveState(s, today) === 'live');
  if (live) return live;
  return publicSpecials[0] ?? null;
}

export function treatmentsToSyncForSpecial(special: Special, today: Date = new Date()): string[] {
  if (resolveEffectiveState(special, today) !== 'live') return [];
  return special.treatmentIds;
}

export function effectiveStateLabel(state: SpecialState): string {
  switch (state) {
    case 'draft': return 'Draft';
    case 'scheduled': return 'Scheduled';
    case 'live': return 'Live';
    case 'expired': return 'Expired';
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function displayStateLabel(state: SpecialDisplayState): string {
  switch (state) {
    case 'ending-soon': return 'Ending soon';
    case 'scheduled': return 'Upcoming';
    case 'live': return 'Live';
    case 'draft': return 'Draft';
    case 'expired': return 'Ended';
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function formatDateShort(iso: string): string {
  const d = parseSpecialDate(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function specialDateMetaLine(
  special: Special,
  displayState: SpecialDisplayState,
  compact = false,
): string {
  if (displayState === 'scheduled') {
    return `From ${compact ? formatDateShort(special.startsAt) : formatDateLabel(special.startsAt)}`;
  }
  if (displayState === 'ending-soon') {
    return `Ends ${compact ? formatDateShort(special.endsAt) : formatDateLabel(special.endsAt)}`;
  }
  if (displayState === 'live') {
    return compact ? `Ends ${formatDateShort(special.endsAt)}` : `Until ${formatDateLabel(special.endsAt)}`;
  }
  return `Ends ${formatDateLabel(special.endsAt)}`;
}

export function daysUntil(iso: string, today: Date = new Date()): number {
  const target = startOfDay(parseSpecialDate(iso));
  const now = startOfDay(today);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

export function schedulePreview(special: Special, today: Date = new Date()): string {
  const state = resolveEffectiveState(special, today);
  if (state === 'draft') return 'Saved as draft — hidden from clients';
  if (state === 'scheduled') {
    const days = daysUntil(special.startsAt, today);
    return `Goes live ${formatDateLabel(special.startsAt)}${days > 0 ? ` · in ${days} day${days === 1 ? '' : 's'}` : ''} · Ends ${formatDateLabel(special.endsAt)}`;
  }
  if (state === 'live') {
    const daysLeft = daysUntil(special.endsAt, today);
    return `Live now · Ends ${formatDateLabel(special.endsAt)}${daysLeft >= 0 ? ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : ''}`;
  }
  return `Ended ${formatDateLabel(special.endsAt)}`;
}

export function formatDateLabel(iso: string): string {
  const d = parseSpecialDate(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface SpecialValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSpecial(
  draft: Partial<Special>,
  treatments: Treatment[],
  asDraft: boolean,
  today: Date = new Date(),
): SpecialValidationResult {
  const errors: string[] = [];
  const normalized = normalizeSpecial(draft);

  if (!normalized.title.trim()) errors.push('Title is required');
  if (normalized.endsAt < normalized.startsAt) errors.push('End date must be on or after start date');

  if (!asDraft && resolveEffectiveState(normalized, today) !== 'draft') {
    const end = startOfDay(parseSpecialDate(normalized.endsAt));
    if (end < startOfDay(today)) errors.push('End date must be today or later when publishing');
  }

  if (normalized.kind === 'single') {
    if (normalized.treatmentIds.length !== 1) errors.push('Single specials must include exactly one treatment');
    const treatment = treatments.find((t) => t.id === normalized.treatmentIds[0]);
    if (treatment) {
      const computed = computeSpecialPrice(normalized, treatment.price);
      if (computed <= 0) errors.push('Special price must be greater than zero');
      if (computed >= treatment.price) errors.push('Special price must be lower than the treatment price');
      if (normalized.discountType === 'percent') {
        const pct = normalized.percentOff ?? 0;
        if (pct < 1 || pct > 99) errors.push('Percent off must be between 1 and 99');
      }
      if (normalized.discountType === 'amount') {
        const off = normalized.amountOff ?? 0;
        if (off <= 0 || off >= treatment.price) errors.push('Amount off must be greater than zero and less than the treatment price');
      }
    }
  }

  if (normalized.kind === 'bundle') {
    if (normalized.treatmentIds.length < 2) errors.push('Bundles must include at least two treatments');
    const sum = computeOriginalPrice(normalized, treatments);
    if (normalized.price <= 0) errors.push('Bundle price must be greater than zero');
    if (sum > 0 && normalized.price >= sum) errors.push('Bundle price must be lower than the combined treatment prices');
  }

  return { valid: errors.length === 0, errors };
}
