import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { SpecialsService } from '../../../core/services/specials.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { Special } from '../../../core/models';

@Component({
  selector: 'app-specials',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './specials.html',
  styleUrl: './specials.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Specials {
  private readonly specialsSvc = inject(SpecialsService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  readonly specials = toSignal(this.specialsSvc.listAll(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });
  readonly editing = signal<Partial<Special> | null>(null);
  readonly isNew = signal(false);
  readonly states: Special['state'][] = ['draft', 'scheduled', 'live', 'expired'];

  startNew(): void {
    this.isNew.set(true);
    const today = new Date().toISOString().slice(0, 10);
    this.editing.set({
      title: '', scriptTitle: '', treatmentId: null, description: '', price: 0, originalPrice: 0,
      startsAt: today, endsAt: today, therapistIds: [], finePrint: 'One per client. Cannot be combined with other offers.', state: 'draft',
    });
  }
  edit(s: Special): void { this.isNew.set(false); this.editing.set({ ...s }); }
  cancel(): void { this.editing.set(null); }

  async save(): Promise<void> {
    const d = this.editing();
    if (!d || !d.title) return;
    if (this.isNew()) { const payload = { ...d }; delete (payload as any).id; await this.specialsSvc.create(payload as any); }
    else if (d.id) { await this.specialsSvc.update(d.id, d as any); }
    this.editing.set(null);
  }

  async remove(s: Special): Promise<void> {
    if (!confirm(`Remove "${s.title}"?`)) return;
    await this.specialsSvc.remove(s.id);
  }
}
