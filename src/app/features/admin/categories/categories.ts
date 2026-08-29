import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categories {
  private readonly categoriesSvc = inject(CategoriesService);
  readonly categories = toSignal(this.categoriesSvc.listAll(), { initialValue: [] });
  readonly editing = signal<Partial<Category> | null>(null);
  readonly isNew = signal(false);
  readonly icons = ['treatments', 'droplet', 'leaf', 'scissors', 'star', 'specials'];
  readonly tints: Category['tint'][] = ['blush', 'sage', 'sky', 'sand'];

  startNew(): void {
    this.isNew.set(true);
    this.editing.set({ name: '', slug: '', icon: 'droplet', tint: 'blush', sortOrder: this.categories().length, active: true });
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

  async remove(c: Category): Promise<void> {
    if (!confirm(`Remove "${c.name}"?`)) return;
    await this.categoriesSvc.remove(c.id);
  }
}
