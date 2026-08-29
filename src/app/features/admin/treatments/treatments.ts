import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { Treatment } from '../../../core/models';

type Draft = Partial<Treatment>;

@Component({
  selector: 'app-treatments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './treatments.html',
  styleUrl: './treatments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Treatments {
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly categoriesSvc = inject(CategoriesService);

  readonly treatments = toSignal(this.treatmentsSvc.listAll(), { initialValue: [] });
  readonly categories = toSignal(this.categoriesSvc.listAll(), { initialValue: [] });

  readonly editing = signal<Draft | null>(null);
  readonly isNew = signal(false);

  startNew(): void {
    this.isNew.set(true);
    this.editing.set({
      name: '', slug: '', categoryId: '', categoryName: '', shortDescription: '', description: '',
      durationMinutes: 60, price: 0, onSpecial: false, beforeAppointment: [], performedByTherapistIds: [],
      relatedTreatmentIds: [], consentTemplateId: null, active: true, sortOrder: this.treatments().length,
    });
  }

  edit(t: Treatment): void {
    this.isNew.set(false);
    this.editing.set({ ...t });
  }

  cancel(): void {
    this.editing.set(null);
  }

  onCategoryChange(categoryId: string): void {
    const cat = this.categories().find((c) => c.id === categoryId);
    this.editing.update((d) => (d ? { ...d, categoryId, categoryName: cat?.name ?? '' } : d));
  }

  async save(): Promise<void> {
    const d = this.editing();
    if (!d || !d.name) return;
    const slug = d.slug || d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const payload = { ...d, slug };
    if (this.isNew()) {
      delete (payload as any).id;
      await this.treatmentsSvc.create(payload as any);
    } else if (d.id) {
      await this.treatmentsSvc.update(d.id, payload as any);
    }
    this.editing.set(null);
  }

  async remove(t: Treatment): Promise<void> {
    if (!confirm(`Remove "${t.name}"?`)) return;
    await this.treatmentsSvc.remove(t.id);
  }

  async toggleActive(t: Treatment): Promise<void> {
    await this.treatmentsSvc.update(t.id, { active: !t.active } as any);
  }
}
