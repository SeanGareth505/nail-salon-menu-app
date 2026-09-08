import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Category, Treatment } from '../../../core/models';
import { CategoriesService } from '../../../core/services/categories.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { SpecialPricingService } from '../../../core/services/special-pricing.service';
import { Treatments } from './treatments';

describe('Treatment discovery', () => {
  let categories: BehaviorSubject<Category[]>;
  let treatments: BehaviorSubject<Treatment[]>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let navigate: jasmine.Spy;
  let component: Treatments;

  beforeEach(() => {
    categories = new BehaviorSubject([{ id: 'nails', slug: 'nails', name: 'Nails' } as Category]);
    treatments = new BehaviorSubject([
      {
        id: 'gel',
        name: 'Gel manicure',
        shortDescription: 'A lasting finish',
        categoryId: 'nails',
        price: 650,
        durationMinutes: 60,
        sortOrder: 1,
      },
      {
        id: 'express',
        name: 'Express manicure',
        shortDescription: 'A quick refresh',
        categoryId: 'nails',
        price: 300,
        durationMinutes: 30,
        sortOrder: 2,
      },
      {
        id: 'massage',
        name: 'Massage',
        shortDescription: 'Relax and unwind',
        categoryId: 'body',
        price: 800,
        durationMinutes: 90,
        sortOrder: 3,
      },
    ] as Treatment[]);
    params = new BehaviorSubject(convertToParamMap({ category: 'nails' }));
    navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    TestBed.configureTestingModule({
      imports: [Treatments],
      providers: [
        { provide: CategoriesService, useValue: { listActive: () => categories } },
        { provide: TreatmentsService, useValue: { listActive: () => treatments } },
        {
          provide: SpecialPricingService,
          useValue: {
            getTreatmentView: (id: string) => (id === 'gel' ? { displayPrice: 450 } : null),
            isOnSpecialFilter: (id: string) => id === 'gel',
          },
        },
        { provide: ActivatedRoute, useValue: { queryParamMap: params } },
        { provide: Router, useValue: { navigate } },
      ],
    }).overrideComponent(Treatments, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(Treatments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('uses the discounted price in the budget filter and price sort', () => {
    component.priceFilter.set(true);
    component.sortOrder.set('price-low');
    expect(component.filtered().map((t) => t.id)).toEqual(['express', 'gel']);
  });

  it('combines search, category, duration and special filters', () => {
    component.search.set('manicure');
    component.durationFilter.set('under45');
    expect(component.filtered().map((t) => t.id)).toEqual(['express']);
    component.specialFilter.set(true);
    expect(component.filtered()).toEqual([]);
  });

  it('clears every filter and removes the category from the URL', () => {
    component.search.set('gel');
    component.durationFilter.set('under45');
    component.priceFilter.set(true);
    component.specialFilter.set(true);
    component.clearSearch();
    expect(component.hasAnyFilter()).toBeFalse();
    expect(component.filtered().length).toBe(3);
    expect(navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { category: null } }),
    );
  });

  it('follows category changes from browser navigation', () => {
    params.next(convertToParamMap({}));
    expect(component.activeCategorySlug()).toBe('all');
    expect(component.filtered().length).toBe(3);
  });

  it('distinguishes an empty catalogue from a failed request', () => {
    treatments.next([]);
    expect(component.loading()).toBeFalse();
    expect(component.loadError()).toBeFalse();
    expect(component.filtered()).toEqual([]);
    treatments.error(new Error('Offline'));
    expect(component.loading()).toBeFalse();
    expect(component.loadError()).toBeTrue();
  });
});
