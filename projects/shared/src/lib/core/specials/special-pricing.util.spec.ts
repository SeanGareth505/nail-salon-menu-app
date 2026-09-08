import { Special, Treatment } from '../models';
import {
  computeOriginalPrice,
  computeSpecialPrice,
  displayStateLabel,
  getPublicSpecials,
  getTreatmentSpecialView,
  isEndingSoon,
  isOnSpecialFilter,
  normalizeSpecial,
  resolveDisplayState,
  resolveEffectiveState,
  specialDateMetaLine,
} from './special-pricing.util';

const treatments = [
  { id: 'facial', price: 780 },
  { id: 'mani', price: 350 },
  { id: 'pedi', price: 420 },
  { id: 'massage', price: 690 },
] as Treatment[];

function makeSpecial(overrides: Partial<Special> & { id: string }): Special {
  return normalizeSpecial({
    title: 'Test',
    scriptTitle: 'Test',
    description: 'Desc',
    price: 100,
    originalPrice: 200,
    startsAt: '2026-08-01',
    endsAt: '2026-09-30',
    therapistIds: [],
    finePrint: '',
    isDraft: false,
    sortOrder: 0,
    featured: false,
    treatmentIds: [],
    discountType: 'fixed',
    kind: 'promo',
    ...overrides,
  });
}

describe('special-pricing.util', () => {
  const today = new Date(2026, 7, 29);

  describe('normalizeSpecial', () => {
    it('migrates legacy treatmentId to treatmentIds and infers single kind', () => {
      const s = normalizeSpecial({ id: 'x', treatmentId: 'facial', state: 'live' });
      expect(s.treatmentIds).toEqual(['facial']);
      expect(s.kind).toBe('single');
    });

    it('infers bundle kind from multiple treatmentIds', () => {
      const s = normalizeSpecial({ id: 'x', treatmentIds: ['mani', 'pedi'] });
      expect(s.kind).toBe('bundle');
    });
  });

  describe('resolveEffectiveState', () => {
    it('returns scheduled when start date is in the future', () => {
      const s = makeSpecial({ id: 'future', startsAt: '2026-09-12', endsAt: '2026-09-30', treatmentIds: ['massage'], kind: 'single' });
      expect(resolveEffectiveState(s, today)).toBe('scheduled');
    });

    it('returns live when today is within the date range', () => {
      const s = makeSpecial({ id: 'live', startsAt: '2026-08-01', endsAt: '2026-09-30', treatmentIds: ['facial'], kind: 'single' });
      expect(resolveEffectiveState(s, today)).toBe('live');
    });

    it('returns expired when end date has passed', () => {
      const s = makeSpecial({ id: 'ended', startsAt: '2026-07-01', endsAt: '2026-08-01', treatmentIds: ['facial'], kind: 'single' });
      expect(resolveEffectiveState(s, today)).toBe('expired');
    });

    it('returns draft when isDraft is true regardless of dates', () => {
      const s = makeSpecial({ id: 'draft', isDraft: true, startsAt: '2026-08-01', endsAt: '2026-09-30' });
      expect(resolveEffectiveState(s, today)).toBe('draft');
    });
  });

  describe('resolveDisplayState', () => {
    it('returns ending-soon when live special ends within seven days', () => {
      const s = makeSpecial({
        id: 'ending',
        kind: 'bundle',
        treatmentIds: ['mani', 'pedi'],
        startsAt: '2026-08-12',
        endsAt: '2026-09-05',
      });
      expect(resolveDisplayState(s, today)).toBe('ending-soon');
      expect(isEndingSoon(s, today)).toBe(true);
      expect(displayStateLabel('ending-soon')).toBe('Ending soon');
    });

    it('returns live when more than seven days remain', () => {
      const s = makeSpecial({
        id: 'live',
        kind: 'single',
        treatmentIds: ['facial'],
        startsAt: '2026-08-01',
        endsAt: '2026-09-30',
      });
      expect(resolveDisplayState(s, today)).toBe('live');
      expect(isEndingSoon(s, today)).toBe(false);
    });
  });

  describe('computeSpecialPrice', () => {
    it('uses fixed price for fixed discount type', () => {
      const s = makeSpecial({ id: 'fixed', kind: 'single', discountType: 'fixed', price: 650, treatmentIds: ['facial'] });
      expect(computeSpecialPrice(s, 780)).toBe(650);
    });

    it('calculates percent off', () => {
      const s = makeSpecial({ id: 'pct', kind: 'single', discountType: 'percent', percentOff: 15, treatmentIds: ['massage'] });
      expect(computeSpecialPrice(s, 690)).toBe(587);
    });

    it('calculates amount off', () => {
      const s = makeSpecial({ id: 'amt', kind: 'single', discountType: 'amount', amountOff: 50, treatmentIds: ['facial'] });
      expect(computeSpecialPrice(s, 780)).toBe(730);
    });
  });

  describe('computeOriginalPrice', () => {
    it('sums treatment prices for bundles', () => {
      const s = makeSpecial({ id: 'bundle', kind: 'bundle', treatmentIds: ['mani', 'pedi'] });
      expect(computeOriginalPrice(s, treatments)).toBe(770);
    });
  });

  describe('getTreatmentSpecialView', () => {
    it('returns special badge and reduced price for live single discounts', () => {
      const s = makeSpecial({ id: 'single', kind: 'single', discountType: 'fixed', price: 650, treatmentIds: ['facial'], startsAt: '2026-08-01', endsAt: '2026-09-30' });
      const view = getTreatmentSpecialView('facial', [s], treatments, today);
      expect(view?.badge).toBe('special');
      expect(view?.displayPrice).toBe(650);
      expect(view?.originalPrice).toBe(780);
    });

    it('returns bundle badge without price override', () => {
      const s = makeSpecial({ id: 'bundle', kind: 'bundle', price: 650, treatmentIds: ['mani', 'pedi'], startsAt: '2026-08-01', endsAt: '2026-09-30' });
      const view = getTreatmentSpecialView('mani', [s], treatments, today);
      expect(view?.badge).toBe('bundle');
      expect(view?.displayPrice).toBeNull();
      expect(view?.originalPrice).toBeNull();
    });

    it('does not affect menu for scheduled specials', () => {
      const s = makeSpecial({ id: 'upcoming', kind: 'single', price: 500, treatmentIds: ['massage'], startsAt: '2026-09-12', endsAt: '2026-09-30' });
      const view = getTreatmentSpecialView('massage', [s], treatments, today);
      expect(view).toBeNull();
    });
  });

  describe('isOnSpecialFilter', () => {
    it('includes live single and bundle members', () => {
      const single = makeSpecial({ id: 'single', kind: 'single', price: 650, treatmentIds: ['facial'], startsAt: '2026-08-01', endsAt: '2026-09-30' });
      const bundle = makeSpecial({ id: 'bundle', kind: 'bundle', price: 650, treatmentIds: ['mani', 'pedi'], startsAt: '2026-08-01', endsAt: '2026-09-30' });
      const specials = [single, bundle];
      expect(isOnSpecialFilter('facial', specials, today)).toBe(true);
      expect(isOnSpecialFilter('pedi', specials, today)).toBe(true);
      expect(isOnSpecialFilter('massage', specials, today)).toBe(false);
    });

    it('excludes scheduled specials from filter', () => {
      const s = makeSpecial({ id: 'upcoming', kind: 'single', price: 500, treatmentIds: ['massage'], startsAt: '2026-09-12', endsAt: '2026-09-30' });
      expect(isOnSpecialFilter('massage', [s], today)).toBe(false);
    });
  });

  describe('getPublicSpecials', () => {
    it('includes live and scheduled specials, excludes draft and expired', () => {
      const live = makeSpecial({ id: 'live', kind: 'single', treatmentIds: ['facial'], startsAt: '2026-08-01', endsAt: '2026-09-30' });
      const scheduled = makeSpecial({ id: 'sched', kind: 'single', treatmentIds: ['massage'], startsAt: '2026-09-12', endsAt: '2026-09-30' });
      const draft = makeSpecial({ id: 'draft', isDraft: true, startsAt: '2026-08-01', endsAt: '2026-09-30' });
      const expired = makeSpecial({ id: 'exp', kind: 'single', treatmentIds: ['facial'], startsAt: '2026-07-01', endsAt: '2026-08-01' });
      const result = getPublicSpecials([live, scheduled, draft, expired], today);
      expect(result.map((s) => s.id)).toEqual(['sched', 'live']);
    });
  });

  describe('resolveDisplayState', () => {
    it('returns ending-soon when live special ends within threshold', () => {
      const s = makeSpecial({ id: 'soon', startsAt: '2026-08-01', endsAt: '2026-09-05', treatmentIds: ['facial'], kind: 'single' });
      expect(resolveDisplayState(s, today)).toBe('ending-soon');
    });
  });

  describe('specialDateMetaLine', () => {
    it('uses Ends for compact live specials', () => {
      const s = makeSpecial({ id: 'live', startsAt: '2026-08-01', endsAt: '2026-09-30', treatmentIds: ['facial'], kind: 'single' });
      expect(specialDateMetaLine(s, 'live', true)).toMatch(/^Ends 30 Sep/);
    });

    it('uses Until for full live specials', () => {
      const s = makeSpecial({ id: 'live', startsAt: '2026-08-01', endsAt: '2026-09-30', treatmentIds: ['facial'], kind: 'single' });
      expect(specialDateMetaLine(s, 'live', false)).toMatch(/^Until 30 Sep/);
    });

    it('uses Ends for ending-soon specials', () => {
      const s = makeSpecial({ id: 'soon', startsAt: '2026-08-01', endsAt: '2026-09-05', treatmentIds: ['facial'], kind: 'single' });
      expect(specialDateMetaLine(s, 'ending-soon', false)).toMatch(/^Ends 5 Sep/);
    });
  });
});
