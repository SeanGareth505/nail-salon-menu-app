import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '@core/services/categories.service';
import { TreatmentsService } from '@core/services/treatments.service';
import { Category } from '@core/models';
import { SfIcon } from '@shared/components/icon/icon';
import { SfPageActionDirective } from '@shared/directives/page-action.directive';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, SfIcon, SfPageActionDirective],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categories {
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  readonly pageAction = (): void => this.startNew();
  readonly categories = toSignal(this.categoriesSvc.listAll(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listAll(), { initialValue: [] });
  readonly editing = signal<Partial<Category> | null>(null);
  readonly isNew = signal(false);
  readonly icons = [
    'spa',
    'brush',
    'face_retouching_natural',
    'self_improvement',
    'content_cut',
    'visibility',
    'water_drop',
    'eco',
    'star',
  ];
  readonly tints: Category['tint'][] = ['blush', 'sage', 'sky', 'sand'];

  startNew(): void {
    this.isNew.set(true);
    this.editing.set({ name: '', slug: '', icon: 'spa', tint: 'blush', sortOrder: this.categories().length, active: true });
  }
  edit(c: Category): void { this.isNew.set(false); this.editing.set({ ...c }); }
  cancel(): void { this.editing.set(null); }

  async save(): Promise<void> {
    const d = this.editing();
    if (!d || !d.name) return;
    const slug = d.slug || d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const payload = { ...d, slug };
    if (this.isNew()) { delete (payload as any).id; await this.categoriesSvc.create(payload as any); }
    else if (d.id) { await this.categoriesSvc.update(d.id, payload as any); }
    this.editing.set(null);
  }

  async remove(c: Category | Partial<Category>): Promise<void> {
    if (!c.id || !c.name) return;
    const linked = this.treatmentCount(c.id);
    const warning =
      linked > 0
        ? `Remove "${c.name}"? ${linked} treatment${linked === 1 ? '' : 's'} still use this category.`
        : `Remove "${c.name}"?`;
    if (!confirm(warning)) return;
    await this.categoriesSvc.remove(c.id);
    if (this.editing()?.id === c.id) {
      this.editing.set(null);
    }
  }

  treatmentCount(categoryId: string): number {
    return this.treatments().filter((t) => t.categoryId === categoryId).length;
  }

  iconFor(icon: string | undefined): string {
    const map: Record<string, string> = {
      spa: 'spa',
      brush: 'brush',
      face_retouching_natural: 'facial',
      self_improvement: 'massage',
      content_cut: 'scissors',
      visibility: 'eye',
      water_drop: 'droplet',
      eco: 'leaf',
      star: 'star',
    };
    return map[icon ?? ''] ?? 'leaf';
  }
}
