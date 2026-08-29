import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TherapistsService } from '../../../core/services/therapists.service';
import { TherapistAuthProvisioningService } from '../../../core/services/therapist-auth-provisioning.service';
import { THERAPIST_PIN_LENGTH } from '../../../core/auth/therapist-auth.util';
import { Therapist } from '../../../core/models';

@Component({
  selector: 'app-therapists',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './therapists.html',
  styleUrl: './therapists.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Therapists {
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly pinSvc = inject(TherapistAuthProvisioningService);

  readonly therapists = toSignal(this.therapistsSvc.listAll(), { initialValue: [] });
  readonly editing = signal<Partial<Therapist> | null>(null);
  readonly isNew = signal(false);
  readonly tints: Therapist['tint'][] = ['blush', 'sage', 'sky', 'sand'];
  readonly expertiseInput = signal('');
  readonly tabletPin = signal('');
  readonly pinError = signal('');
  readonly pinSaving = signal(false);

  startNew(): void {
    this.isNew.set(true);
    this.expertiseInput.set('');
    this.tabletPin.set('');
    this.pinError.set('');
    this.editing.set({
      name: '', slug: '', role: '', bio: '', experienceYears: 1, qualification: '', expertise: [],
      initial: '', tint: 'blush', userId: null, pinEnabled: false, active: true, sortOrder: this.therapists().length,
    });
  }

  edit(t: Therapist): void {
    this.isNew.set(false);
    this.expertiseInput.set((t.expertise ?? []).join(', '));
    this.tabletPin.set('');
    this.pinError.set('');
    this.editing.set({ ...t, pinEnabled: t.pinEnabled ?? false });
  }

  cancel(): void { this.editing.set(null); }

  async save(): Promise<void> {
    const d = this.editing();
    if (!d || !d.name) return;
    const slug = d.slug || d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const initial = d.initial || d.name.charAt(0).toUpperCase();
    const expertise = this.expertiseInput().split(',').map((s) => s.trim()).filter(Boolean);
    const payload = { ...d, slug, initial, expertise, pinEnabled: d.pinEnabled ?? false };

    let id = d.id;
    if (this.isNew()) {
      delete (payload as Partial<Therapist>).id;
      id = await this.therapistsSvc.create(payload as Omit<Therapist, 'id'>);
    } else if (d.id) {
      await this.therapistsSvc.update(d.id, payload as Partial<Therapist>);
    }

    const pin = this.tabletPin().trim();
    if (id && pin.length === THERAPIST_PIN_LENGTH) {
      await this.enableTabletAccess(id, pin);
    }

    this.editing.set(null);
  }

  async enableTabletAccess(therapistId: string, pin?: string): Promise<void> {
    const code = (pin ?? this.tabletPin()).trim();
    this.pinError.set('');
    if (code.length !== THERAPIST_PIN_LENGTH) {
      this.pinError.set(`Enter a ${THERAPIST_PIN_LENGTH}-digit PIN.`);
      return;
    }
    this.pinSaving.set(true);
    try {
      await this.pinSvc.setPin(therapistId, code);
      await this.therapistsSvc.update(therapistId, { pinEnabled: true } as Partial<Therapist>);
      this.tabletPin.set('');
      const current = this.editing();
      if (current?.id === therapistId) {
        this.editing.set({ ...current, pinEnabled: true });
      }
    } catch {
      this.pinError.set('Could not set PIN. If one already exists, enter the current PIN to update it.');
    } finally {
      this.pinSaving.set(false);
    }
  }

  async remove(t: Therapist): Promise<void> {
    if (!confirm(`Remove "${t.name}"?`)) return;
    await this.therapistsSvc.remove(t.id);
  }
}
