import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CategoriesService } from '../../../core/services/categories.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { ConsentTemplatesService } from '../../../core/services/consent-templates.service';
import { Category } from '../../../core/models';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfEmptyState } from '../../../shared/components/empty-state/empty-state';
import { formatRand } from '../../../core/utils/format-rand.util';

@Component({
  selector: 'app-treatment-menu',
  standalone: true,
  imports: [RouterLink, SfIcon, SfEmptyState],
  templateUrl: './treatment-menu.html',
  styleUrl: './treatment-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreatmentMenu {
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly templatesSvc = inject(ConsentTemplatesService);

  readonly categories = toSignal(this.categoriesSvc.listActive(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });
  readonly templates = toSignal(this.templatesSvc.listAll(), { initialValue: [] });

  readonly selectedCategoryId = signal<string | null>(null);

  readonly effectiveCategoryId = computed(() => this.selectedCategoryId() ?? this.categories()[0]?.id ?? null);

  readonly selectedCategory = computed(() => {
    const id = this.effectiveCategoryId();
    return this.categories().find((c) => c.id === id) ?? null;
  });

  readonly categoryTreatments = computed(() => {
    const cat = this.selectedCategory();
    if (!cat) return [];
    return this.treatments().filter((t) => t.categoryId === cat.id);
  });

  consentLabel(cat: Category): string {
    const treatment = this.treatments().find((t) => t.categoryId === cat.id && t.consentTemplateId);
    if (!treatment?.consentTemplateId) return 'General consent';
    const template = this.templates().find((t) => t.id === treatment.consentTemplateId);
    return template?.name ?? 'General consent';
  }

  formatPrice(amount: number): string {
    return formatRand(amount);
  }
}
