import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TherapistsService } from '../../../core/services/therapists.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { Therapist } from '../../../core/models';
import { SfPageActionDirective } from '../../../shared/directives/page-action.directive';

@Component({
  selector: 'app-therapists',
  standalone: true,
  imports: [FormsModule, SfPageActionDirective],
  templateUrl: './therapists.html',
  styleUrl: './therapists.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Therapists {
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly treatmentsSvc = inject(TreatmentsService);

  readonly pageAction = (): void => this.startNew();

  readonly therapists = toSignal(this.therapistsSvc.listAll(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listAll(), { initialValue: [] });

  readonly editing = signal<Partial<Therapist> | null>(null);
  readonly isNew = signal(false);
  readonly tints: Therapist['tint'][] = ['blush', 'sage', 'sky', 'sand'];
  readonly expertiseInput = signal('');
  readonly saveError = signal('');
  readonly saving = signal(false);

  startNew(): void {
    this.isNew.set(true);
    this.expertiseInput.set('');
    this.saveError.set('');
    this.editing.set({
      name: '', slug: '', role: '', bio: '', experienceYears: 1, qualification: '', expertise: [],
      initial: '', tint: 'blush', userId: null, pinEnabled: false, active: true, sortOrder: this.therapists().length,
    });
  }

  edit(t: Therapist): void {
    this.isNew.set(false);
    this.expertiseInput.set((t.expertise ?? []).join(', '));
    this.saveError.set('');
    this.editing.set({ ...t });
  }

  cancel(): void { this.editing.set(null); }

  async save(): Promise<void> {
    const d = this.editing();
    if (!d || !d.name) return;

    const slug = d.slug || d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const initial = d.initial || d.name.charAt(0).toUpperCase();
    const expertise = this.expertiseInput().split(',').map((s) => s.trim()).filter(Boolean);
    const payload = { ...d, slug, initial, expertise, pinEnabled: false };

    this.saveError.set('');
    this.saving.set(true);
    try {
      if (this.isNew()) {
        delete (payload as Partial<Therapist>).id;
        await this.therapistsSvc.create(payload as Omit<Therapist, 'id'>);
      } else if (d.id) {
        await this.therapistsSvc.update(d.id, payload as Partial<Therapist>);
      }
      this.editing.set(null);
    } catch {
      this.saveError.set('Could not save therapist. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(t: Therapist): Promise<void> {
    if (!confirm(`Remove "${t.name}"?`)) return;
    await this.therapistsSvc.remove(t.id);
  }

  treatmentCount(therapistId: string): number {
    return this.treatments().filter((t) => t.performedByTherapistIds.includes(therapistId)).length;
  }
}
