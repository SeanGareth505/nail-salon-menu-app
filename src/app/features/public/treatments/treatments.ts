import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../../core/services/categories.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { SpecialPricingService } from '../../../core/services/special-pricing.service';
import { categorySfIcon } from '../../../shared/utils/category-icon.util';
import { Category, Treatment } from '../../../core/models';
import { TreatmentSpecialView } from '../../../core/specials/special-pricing.util';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfTreatmentCard } from '../../../shared/components/treatment-card/treatment-card';
import { SfEmptyStateAnimation } from '../../../shared/components/empty-state-animation/empty-state-animation';
import { SfSkeleton } from '../../../shared/components/skeleton-loader/skeleton-loader';
import { catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { expandCollapse } from '../../../shared/animations/motion.animations';

@Component({
  selector: 'app-treatments',
  standalone: true,
  imports: [RouterLink, FormsModule, SfIcon, SfTreatmentCard, SfEmptyStateAnimation, SfSkeleton],
  templateUrl: './treatments.html',
  styleUrl: './treatments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [expandCollapse],
})
export class Treatments {
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly pricingSvc = inject(SpecialPricingService);
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);
  readonly refresh = signal(0);
  readonly catalog = toSignal(
    toObservable(this.refresh).pipe(
      switchMap(() =>
        combineLatest([this.categoriesSvc.listActive(), this.treatmentsSvc.listActive()]).pipe(
          map(([categories, treatments]) => ({
            categories,
            treatments,
            loading: false,
            error: false,
          })),
          startWith({
            categories: [] as Category[],
            treatments: [] as Treatment[],
            loading: true,
            error: false,
          }),
          catchError(() =>
            of({
              categories: [] as Category[],
              treatments: [] as Treatment[],
              loading: false,
              error: true,
            }),
          ),
        ),
      ),
    ),
    {
      initialValue: {
        categories: [] as Category[],
        treatments: [] as Treatment[],
        loading: true,
        error: false,
      },
    },
  );
  readonly categories = computed(() => this.catalog().categories);
  readonly treatments = computed(() => this.catalog().treatments);
  readonly loading = computed(() => this.catalog().loading);
  readonly loadError = computed(() => this.catalog().error);
  readonly sortOrder = signal('recommended');
  readonly hasAnyFilter = computed(
    () => !!this.search().trim() || this.activeCategorySlug() !== 'all' || this.hasActiveRefine(),
  );

  readonly search = signal('');
  readonly activeCategorySlug = signal<string>('all');
  readonly showRefine = signal(false);
  readonly durationFilter = signal<'any' | 'under45'>('any');
  readonly priceFilter = signal(false);
  readonly specialFilter = signal(false);
  readonly listKey = signal(0);

  readonly activeRefineCount = computed(
    () =>
      Number(this.durationFilter() !== 'any') +
      Number(this.priceFilter()) +
      Number(this.specialFilter()),
  );

  readonly hasActiveRefine = computed(
    () => this.durationFilter() !== 'any' || this.priceFilter() || this.specialFilter(),
  );

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.activeCategorySlug.set(params.get('category') || 'all');
    });
  }

  readonly filtered = computed<Treatment[]>(() => {
    const term = this.search().trim().toLowerCase();
    const catSlug = this.activeCategorySlug();
    const cats = this.categories();
    const duration = this.durationFilter();
    const underPrice = this.priceFilter();
    const onSpecial = this.specialFilter();

    return this.treatments()
      .filter((t) => {
        if (catSlug !== 'all') {
          const cat = cats.find((c) => c.slug === catSlug);
          if (cat && t.categoryId !== cat.id) return false;
        }
        if (
          term &&
          !t.name.toLowerCase().includes(term) &&
          !t.shortDescription.toLowerCase().includes(term)
        )
          return false;
        if (duration === 'under45' && t.durationMinutes >= 45) return false;
        if (underPrice && (this.specialViewFor(t.id)?.displayPrice ?? t.price) >= 500) return false;
        if (onSpecial && !this.pricingSvc.isOnSpecialFilter(t.id)) return false;
        return true;
      })
      .sort((a, b) => {
        if (this.sortOrder() === 'price-low')
          return (
            (this.specialViewFor(a.id)?.displayPrice ?? a.price) -
            (this.specialViewFor(b.id)?.displayPrice ?? b.price)
          );
        if (this.sortOrder() === 'duration') return a.durationMinutes - b.durationMinutes;
        if (this.sortOrder() === 'name') return a.name.localeCompare(b.name);
        return a.sortOrder - b.sortOrder;
      });
  });

  readonly grouped = computed(() => {
    const cats = this.categories();
    const byCategory = new Map<string, Treatment[]>();

    for (const t of this.filtered()) {
      const key = t.categoryId || t.categoryName;
      const list = byCategory.get(key) ?? [];
      list.push(t);
      byCategory.set(key, list);
    }

    return Array.from(byCategory.entries())
      .map(([categoryId, items]) => {
        const category = cats.find((c) => c.id === categoryId || c.name === items[0]?.categoryName);
        return {
          key: categoryId,
          name: category?.name ?? items[0]?.categoryName ?? 'Treatments',
          tint: category?.tint ?? ('blush' as const),
          icon: categorySfIcon(category?.slug ?? '', category?.icon ?? ''),
          count: items.length,
          items,
          sortOrder: category?.sortOrder ?? 999,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  });

  selectCategory(slug: string): void {
    this.activeCategorySlug.set(slug);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: slug === 'all' ? null : slug },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.listKey.update((k) => k + 1);
  }

  categoryCount(id: string): number {
    return this.treatments().filter((t) => t.categoryId === id).length;
  }

  retry(): void {
    this.refresh.update((value) => value + 1);
  }

  toggleRefine(): void {
    this.showRefine.update((v) => !v);
  }

  onFilterChange(): void {
    this.listKey.update((k) => k + 1);
  }

  clearSearch(): void {
    this.search.set('');
    this.selectCategory('all');
    this.durationFilter.set('any');
    this.priceFilter.set(false);
    this.specialFilter.set(false);
    this.showRefine.set(false);
    this.onFilterChange();
  }

  specialViewFor(treatmentId: string): TreatmentSpecialView | null {
    return this.pricingSvc.getTreatmentView(treatmentId);
  }

  categoryFor(treatment: Treatment): Category | undefined {
    return this.categories().find((c) => c.id === treatment.categoryId);
  }

  cardTint(treatment: Treatment): 'blush' | 'sage' | 'sky' | 'sand' {
    return this.categoryFor(treatment)?.tint ?? 'blush';
  }

  cardIcon(treatment: Treatment): string {
    const cat = this.categoryFor(treatment);
    return categorySfIcon(cat?.slug ?? '', cat?.icon ?? '');
  }
}
