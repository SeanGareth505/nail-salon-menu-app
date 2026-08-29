import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TherapistsService } from '../../../core/services/therapists.service';
import { TherapistAuthProvisioningService } from '../../../core/services/therapist-auth-provisioning.service';
import { TherapistStaffAccessService } from '../../../core/services/therapist-staff-access.service';
import { THERAPIST_PIN_LENGTH } from '../../../core/auth/therapist-auth.util';
import { Therapist } from '../../../core/models';

function randomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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
  private readonly staffAccessSvc = inject(TherapistStaffAccessService);

  readonly therapists = toSignal(this.therapistsSvc.listAll(), { initialValue: [] });
  readonly staffAccess = toSignal(this.staffAccessSvc.listAll(), { initialValue: [] });
  readonly pinByTherapistId = computed(() => {
    const map = new Map<string, string>();
    for (const row of this.staffAccess()) {
      map.set(row.therapistId, row.pin);
    }
    return map;
  });

  readonly editing = signal<Partial<Therapist> | null>(null);
  readonly isNew = signal(false);
  readonly tints: Therapist['tint'][] = ['blush', 'sage', 'sky', 'sand'];
  readonly expertiseInput = signal('');
  readonly tabletPin = signal('');
  readonly pinError = signal('');
  readonly pinSaving = signal(false);
  readonly showPins = signal(true);

  pinFor(therapistId: string): string | null {
    return this.pinByTherapistId().get(therapistId) ?? null;
  }

  startNew(): void {
    this.isNew.set(true);
    this.expertiseInput.set('');
    this.tabletPin.set(randomPin());
    this.pinError.set('');
    this.editing.set({
      name: '', slug: '', role: '', bio: '', experienceYears: 1, qualification: '', expertise: [],
      initial: '', tint: 'blush', userId: null, pinEnabled: false, active: true, sortOrder: this.therapists().length,
    });
  }

  edit(t: Therapist): void {
    this.isNew.set(false);
    this.expertiseInput.set((t.expertise ?? []).join(', '));
    this.tabletPin.set(this.pinFor(t.id) ?? randomPin());
    this.pinError.set('');
    this.editing.set({ ...t, pinEnabled: t.pinEnabled ?? false });
  }

  cancel(): void { this.editing.set(null); }

  generatePin(): void {
    this.tabletPin.set(randomPin());
  }

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
      const existingPin = this.pinFor(therapistId);
      await this.pinSvc.setPin(therapistId, code, existingPin);
      await this.therapistsSvc.update(therapistId, { pinEnabled: true } as Partial<Therapist>);
      this.tabletPin.set(code);
      const current = this.editing();
      if (current?.id === therapistId) {
        this.editing.set({ ...current, pinEnabled: true });
      }
    } catch {
      this.pinError.set('Could not save PIN. Check the code is 6 digits and try again.');
    } finally {
      this.pinSaving.set(false);
    }
  }

  async revokeEditingPin(): Promise<void> {
    const d = this.editing();
    if (!d?.id) return;
    const t = this.therapists().find((row) => row.id === d.id);
    if (!t) return;
    await this.revokePin(t);
  }

  async revokePin(t: Therapist): Promise<void> {
    if (!confirm(`Remove PIN sign-in for "${t.name}"? They will no longer appear on the therapist login screen.`)) return;
    await this.pinSvc.revokePin(t.id);
    await this.therapistsSvc.update(t.id, { pinEnabled: false } as Partial<Therapist>);
    if (this.editing()?.id === t.id) {
      this.editing.update((d) => (d ? { ...d, pinEnabled: false } : d));
      this.tabletPin.set(randomPin());
    }
  }

  async remove(t: Therapist): Promise<void> {
    if (!confirm(`Remove "${t.name}"?`)) return;
    if (t.pinEnabled) {
      await this.pinSvc.revokePin(t.id);
    }
    await this.therapistsSvc.remove(t.id);
  }
}
