import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { TreatmentsService } from '@core/services/treatments.service';
import { CategoriesService } from '@core/services/categories.service';
import { SpecialsService } from '@core/services/specials.service';
import { TherapistsService } from '@core/services/therapists.service';
import { ConsentTemplatesService } from '@core/services/consent-templates.service';
import { StorageUploadService } from '@core/services/storage-upload.service';
import { DEFAULT_CONSENT_TEMPLATE_ID } from '@core/consent/default-consent-template';
import { Category, Treatment } from '@core/models';
import { normalizeSpecial, resolveEffectiveState, computeSpecialPrice } from '@core/specials/special-pricing.util';
import { SfAdminToggle } from '@shared/components/admin-toggle/admin-toggle';
import { SfIcon } from '@shared/components/icon/icon';
import { formatRand } from '@core/utils/format-rand.util';
import { SfPageActionDirective } from '@shared/directives/page-action.directive';

type Draft = Partial<Treatment>;

const TINT_BG: Record<Category['tint'], string> = {
  blush: '#F7E9E3',
  sage: '#F0F4F0',
  sky: '#E3F0F9',
  sand: '#F5EFE7',
};

const TINT_MARK: Record<Category['tint'], string> = {
  blush: '#C9A96E',
  sage: '#8BAA8E',
  sky: '#8FB4CE',
  sand: '#C9A96E',
};

@Component({
  selector: 'app-treatments',
  standalone: true,
  imports: [FormsModule, SfPageActionDirective, SfAdminToggle, SfIcon, CdkDropList, CdkDrag],
  templateUrl: './treatments.html',
  styleUrl: './treatments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Treatments {
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly specialsSvc = inject(SpecialsService);
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly consentTemplatesSvc = inject(ConsentTemplatesService);
  private readonly uploadSvc = inject(StorageUploadService);
  private readonly router = inject(Router);

  readonly pageAction = (): void => this.startNew();

  readonly catFilter = signal('All');
  readonly uploadingImage = signal(false);
  readonly uploadError = signal('');
  readonly reordering = signal(false);

  readonly treatments = toSignal(this.treatmentsSvc.listAll(), { initialValue: [] });
  readonly categories = toSignal(this.categoriesSvc.listAll(), { initialValue: [] });
  readonly therapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });
  readonly consentTemplates = toSignal(this.consentTemplatesSvc.listAll(), { initialValue: [] });
  readonly specials = toSignal(
    this.specialsSvc.listAll().pipe(map((items) => items.map((s) => normalizeSpecial(s)))),
    { initialValue: [] },
  );

  readonly editing = signal<Draft | null>(null);
  readonly isNew = signal(false);

  readonly linkedSpecialFor = computed(() => {
    const map = new Map<string, { id: string; title: string; state: string }>();
    for (const s of this.specials()) {
      const state = resolveEffectiveState(s);
      if (state !== 'live' && state !== 'scheduled') continue;
      for (const tid of s.treatmentIds) {
        map.set(tid, { id: s.id, title: s.title, state });
      }
    }
    return map;
  });

  readonly categoryFilters = computed(() => [
    { name: 'All' },
    ...this.categories().map((c) => ({ name: c.name })),
  ]);

  readonly filteredTreatments = computed(() => {
    const cat = this.catFilter();
    const items = this.treatments();
    if (cat === 'All') return items;
    return items.filter((t) => t.categoryName === cat);
  });

  startNew(): void {
    this.isNew.set(true);
    this.editing.set({
      name: '', slug: '', categoryId: '', categoryName: '', shortDescription: '', description: '',
      durationMinutes: 60, price: 0, beforeAppointment: [], performedByTherapistIds: [],
      relatedTreatmentIds: [], consentTemplateId: DEFAULT_CONSENT_TEMPLATE_ID,
      active: true, featured: false, imageUrl: null, sortOrder: this.treatments().length,
    });
  }

  edit(t: Treatment): void {
    this.isNew.set(false);
    this.editing.set({ ...t, featured: t.featured ?? false, imageUrl: t.imageUrl ?? null });
  }

  cancel(): void {
    this.editing.set(null);
  }

  onCategoryChange(categoryId: string): void {
    const cat = this.categories().find((c) => c.id === categoryId);
    this.editing.update((d) => (d ? { ...d, categoryId, categoryName: cat?.name ?? '' } : d));
  }

  setToggle(field: 'active' | 'featured', value: boolean): void {
    this.editing.update((d) => (d ? { ...d, [field]: value } : d));
  }

  async onReorder(event: CdkDragDrop<Treatment[]>): Promise<void> {
    if (event.previousIndex === event.currentIndex || this.reordering()) return;
    const ordered = [...this.filteredTreatments()];
    moveItemInArray(ordered, event.previousIndex, event.currentIndex);
    const filteredIds = new Set(ordered.map((t) => t.id));
    const all = [...this.treatments()].sort((a, b) => a.sortOrder - b.sortOrder);
    let index = 0;
    const merged = all.map((t) => (filteredIds.has(t.id) ? ordered[index++]! : t));
    const updates = merged.map((t, i) => ({ id: t.id, sortOrder: i + 1 }));
    this.reordering.set(true);
    try {
      await this.treatmentsSvc.reorder(updates);
    } finally {
      this.reordering.set(false);
    }
  }

  async save(): Promise<void> {
    const d = this.editing();
    if (!d || !d.name) return;
    const slug = d.slug || d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const payload = { ...d, slug, featured: d.featured ?? false, imageUrl: d.imageUrl ?? null };
    if (this.isNew()) {
      delete (payload as Partial<Treatment>).id;
      await this.treatmentsSvc.create(payload as Treatment);
    } else if (d.id) {
      await this.treatmentsSvc.update(d.id, payload as Partial<Treatment>);
    }
    this.editing.set(null);
  }

  async remove(t: Treatment): Promise<void> {
    if (!confirm(`Remove "${t.name}"?`)) return;
    await this.treatmentsSvc.remove(t.id);
    if (this.editing()?.id === t.id) {
      this.editing.set(null);
    }
  }

  async removeEditing(): Promise<void> {
    const d = this.editing();
    if (!d?.id) return;
    await this.remove(d as Treatment);
  }

  async openConsentFormFromEditor(): Promise<void> {
    const d = this.editing();
    if (!d?.id) return;
    await this.openConsentForm(d as Treatment);
  }

  async openConsentForm(t: Treatment): Promise<void> {
    const templateId = t.consentTemplateId ?? DEFAULT_CONSENT_TEMPLATE_ID;
    if (!t.consentTemplateId) {
      await this.treatmentsSvc.update(t.id, { consentTemplateId: templateId });
    }
    await this.router.navigate(['/admin/consent-forms'], { queryParams: { template: templateId } });
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const draft = this.editing();
    if (!file || !draft?.id) return;
    this.uploadError.set('');
    this.uploadingImage.set(true);
    try {
      const url = await this.uploadSvc.uploadTreatmentImage(file, draft.id);
      this.editing.update((d) => (d ? { ...d, imageUrl: url } : d));
    } catch {
      this.uploadError.set('Image upload failed. Check Storage rules and try again.');
    } finally {
      this.uploadingImage.set(false);
      input.value = '';
    }
  }

  linkedSpecial(treatmentId: string) {
    return this.linkedSpecialFor().get(treatmentId) ?? null;
  }

  isOnSpecial(treatmentId: string | undefined): boolean {
    if (!treatmentId) return false;
    const treatment = this.treatments().find((item) => item.id === treatmentId);
    return !!(treatment?.onSpecial || this.linkedSpecial(treatmentId));
  }

  formatPrice(amount: number): string {
    return formatRand(amount);
  }

  consentLabel(t: Treatment): string {
    if (!t.consentTemplateId) return 'No consent form';
    const template = this.consentTemplates().find((item) => item.id === t.consentTemplateId);
    return template?.name ?? `${t.categoryName} — consent`;
  }

  therapistChipName(id: string): string {
    const therapist = this.therapists().find((item) => item.id === id);
    return therapist?.name.split(' ')[0] ?? 'Therapist';
  }

  isTherapistAssigned(id: string): boolean {
    return (this.editing()?.performedByTherapistIds ?? []).includes(id);
  }

  toggleTherapist(id: string): void {
    this.editing.update((draft) => {
      if (!draft) return draft;
      const current = draft.performedByTherapistIds ?? [];
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return { ...draft, performedByTherapistIds: next };
    });
  }

  specialPriceLabel(treatmentId: string): string | null {
    const link = this.linkedSpecial(treatmentId);
    if (!link) return null;
    const special = this.specials().find((item) => item.id === link.id);
    const treatment = this.treatments().find((item) => item.id === treatmentId);
    if (!special || !treatment) return null;
    const price = computeSpecialPrice(special, treatment.price);
    return this.formatPrice(price);
  }

  categoryForDraft(): Category | undefined {
    const categoryId = this.editing()?.categoryId;
    if (!categoryId) return undefined;
    return this.categories().find((c) => c.id === categoryId);
  }

  categoryTintBg(): string {
    const cat = this.categoryForDraft();
    return cat ? TINT_BG[cat.tint] : '#F0F4F0';
  }

  categoryMarkColor(): string {
    const cat = this.categoryForDraft();
    return cat ? TINT_MARK[cat.tint] : '#8BAA8E';
  }

  categoryIconName(): string {
    const cat = this.categoryForDraft();
    return this.iconFor(cat?.icon);
  }

  private iconFor(icon: string | undefined): string {
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
