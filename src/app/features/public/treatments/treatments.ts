import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../../core/services/categories.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { Treatment } from '../../../core/models';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfTreatmentCard } from '../../../shared/components/treatment-card/treatment-card';
import { SfEmptyStateAnimation } from '../../../shared/components/empty-state-animation/empty-state-animation';
import { SfSkeleton } from '../../../shared/components/skeleton-loader/skeleton-loader';
import { ActivatedRoute } from '@angular/router';
import { expandCollapse } from '../../../shared/animations/motion.animations';

@Component({
  selector: 'app-treatments',
  standalone: true,
  imports: [FormsModule, SfIcon, SfTreatmentCard, SfEmptyStateAnimation, SfSkeleton],
  templateUrl: './treatments.html',
  styleUrl: './treatments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [expandCollapse],
})
export class Treatments {
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly route = inject(ActivatedRoute);

  readonly categories = toSignal(this.categoriesSvc.listActive(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });

  readonly search = signal('');
  readonly activeCategorySlug = signal<string>('all');
  readonly showRefine = signal(false);
  readonly durationFilter = signal<'any' | 'under45'>('any');
  readonly priceFilter = signal(false);
  readonly specialFilter = signal(false);
  readonly listKey = signal(0);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const cat = params.get('category');
      if (cat) this.activeCategorySlug.set(cat);
    });
  }

  readonly filtered = computed<Treatment[]>(() => {
    const term = this.search().trim().toLowerCase();
    const catSlug = this.activeCategorySlug();
    const cats = this.categories();
    const duration = this.durationFilter();
    const underPrice = this.priceFilter();
    const onSpecial = this.specialFilter();

    return this.treatments().filter((t) => {
      if (catSlug !== 'all') {
        const cat = cats.find((c) => c.slug === catSlug);
        if (cat && t.categoryId !== cat.id) return false;
      }
      if (term && !t.name.toLowerCase().includes(term) && !t.shortDescription.toLowerCase().includes(term)) return false;
      if (duration === 'under45' && t.durationMinutes >= 45) return false;
      if (underPrice && t.price >= 500) return false;
      if (onSpecial && !t.onSpecial) return false;
      return true;
    });
  });

  readonly grouped = computed(() => {
    const groups = new Map<string, Treatment[]>();
    for (const t of this.filtered()) {
      const list = groups.get(t.categoryName) ?? [];
      list.push(t);
      groups.set(t.categoryName, list);
    }
    return Array.from(groups.entries()).map(([name, items]) => ({ name, items }));
  });

  selectCategory(slug: string): void {
    this.activeCategorySlug.set(slug);
    this.listKey.update((k) => k + 1);
  }

  toggleRefine(): void {
    this.showRefine.update((v) => !v);
  }

  onFilterChange(): void {
    this.listKey.update((k) => k + 1);
  }
}
