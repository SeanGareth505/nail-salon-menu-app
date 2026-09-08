import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TherapistsService } from '../../../core/services/therapists.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { StorageUploadService } from '../../../core/services/storage-upload.service';
import { SfPortrait } from '../../../shared/components/portrait/portrait';
import { Therapist } from '../../../core/models';
import { SfPageActionDirective } from '../../../shared/directives/page-action.directive';

@Component({
  selector: 'app-therapists',
  standalone: true,
  imports: [FormsModule, SfPageActionDirective, SfPortrait],
  templateUrl: './therapists.html',
  styleUrl: './therapists.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Therapists implements OnDestroy {
  private readonly uploadSvc = inject(StorageUploadService);
  readonly pendingPhoto = signal<File | null>(null);
  readonly photoPreview = signal<string | null>(null);
  readonly photoError = signal('');
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
    this.clearPhotoSelection();
    this.isNew.set(true);
    this.expertiseInput.set('');
    this.saveError.set('');
    this.editing.set({
      name: '',
      slug: '',
      role: '',
      bio: '',
      experienceYears: 1,
      qualification: '',
      expertise: [],
      imageUrl: null,
      initial: '',
      tint: 'blush',
      userId: null,
      pinEnabled: false,
      active: true,
      sortOrder: this.therapists().length,
    });
  }

  edit(t: Therapist): void {
    this.clearPhotoSelection();
    this.isNew.set(false);
    this.expertiseInput.set((t.expertise ?? []).join(', '));
    this.saveError.set('');
    this.editing.set({ ...t });
  }

  cancel(): void {
    this.clearPhotoSelection();
    this.editing.set(null);
  }

  choosePhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.photoError.set('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.photoError.set('Choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size >= 8 * 1024 * 1024) {
      this.photoError.set('Choose an image smaller than 8 MB.');
      return;
    }
    this.clearPhotoSelection();
    this.pendingPhoto.set(file);
    this.photoPreview.set(URL.createObjectURL(file));
  }

  removePhoto(): void {
    this.clearPhotoSelection();
    this.editing.update((d) => (d ? { ...d, imageUrl: null } : d));
  }

  private clearPhotoSelection(): void {
    const preview = this.photoPreview();
    if (preview) URL.revokeObjectURL(preview);
    this.photoPreview.set(null);
    this.pendingPhoto.set(null);
    this.photoError.set('');
  }

  ngOnDestroy(): void {
    this.clearPhotoSelection();
  }

  async save(): Promise<void> {
    const d = this.editing();
    if (!d || !d.name?.trim() || !d.role?.trim() || this.saving()) return;

    const slug =
      d.slug ||
      d.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const initial = d.initial || d.name.charAt(0).toUpperCase();
    const expertise = this.expertiseInput()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      ...d,
      name: d.name.trim(),
      role: d.role.trim(),
      imageUrl: d.imageUrl ?? null,
      slug,
      initial,
      expertise,
      pinEnabled: false,
    };

    this.saveError.set('');
    this.saving.set(true);
    try {
      const photo = this.pendingPhoto();
      if (photo) {
        payload.imageUrl = await this.uploadSvc.uploadTherapistImage(photo, d.id || slug);
        this.editing.update((current) =>
          current ? { ...current, imageUrl: payload.imageUrl } : current,
        );
        this.clearPhotoSelection();
      }
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
