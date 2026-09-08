import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { SfIcon } from '../icon/icon';

@Component({
  selector: 'sf-consent-form-complete-panel',
  standalone: true,
  imports: [FormsModule, SfIcon, CdkConnectedOverlay, CdkOverlayOrigin],
  templateUrl: './consent-form-complete-panel.html',
  styleUrl: './consent-form-complete-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SfConsentFormCompletePanel {
  private readonly consultationsSvc = inject(ConsultationsService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly destroyRef = inject(DestroyRef);

  private pickerCloseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly consultationId = input.required<string>();
  readonly intendedTherapistId = input<string | null>(null);
  readonly compact = input(false);
  readonly showHead = input(true);
  readonly embedded = input(false);

  readonly completed = output<void>();

  readonly dropdownPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
    },
  ];

  readonly performingTherapistId = signal<string | null>(null);
  readonly selectedTreatmentIds = signal<string[]>([]);
  readonly otherTreatments = signal<string[]>([]);
  readonly customTreatmentDraft = signal('');
  readonly treatmentSearch = signal('');
  readonly treatmentPickerOpen = signal(false);
  readonly error = signal('');
  readonly loading = signal(false);

  readonly therapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });

  readonly selectedTreatments = computed(() =>
    this.treatments().filter((treatment) => this.selectedTreatmentIds().includes(treatment.id)),
  );

  readonly hasSelectedTreatments = computed(
    () => this.selectedTreatments().length > 0 || this.otherTreatments().length > 0,
  );

  readonly filteredTreatments = computed(() => {
    const query = this.treatmentSearch().trim().toLowerCase();
    const selected = new Set(this.selectedTreatmentIds());
    const available = this.treatments().filter((treatment) => !selected.has(treatment.id));

    if (!query) return available.slice(0, 8);

    return available
      .filter((treatment) => {
        const haystack = `${treatment.name} ${treatment.categoryName}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 12);
  });

  readonly showTreatmentResults = computed(
    () => this.treatmentPickerOpen() && this.filteredTreatments().length > 0,
  );

  readonly showCustomTreatmentPrompt = computed(
    () => this.treatmentPickerOpen() && !!this.treatmentSearch().trim() && !this.showTreatmentResults(),
  );

  readonly showTreatmentDropdown = computed(
    () => this.showTreatmentResults() || this.showCustomTreatmentPrompt(),
  );

  readonly canSubmit = computed(() => {
    if (!this.performingTherapistId()) return false;
    return this.selectedTreatmentIds().length > 0 || this.otherTreatments().length > 0;
  });

  readonly submitHint = computed(() => {
    if (this.canSubmit()) return '';
    if (!this.performingTherapistId()) return 'Select a reviewing therapist to continue.';
    return 'Add at least one treatment to continue.';
  });

  readonly selectedPerformingTherapist = computed(
    () => this.therapists().find((therapist) => therapist.id === this.performingTherapistId()) ?? null,
  );

  readonly selectedTreatmentNames = computed(() => [
    ...this.selectedTreatments().map((treatment) => treatment.name),
    ...this.otherTreatments(),
  ]);

  constructor() {
    effect(() => {
      const intended = this.intendedTherapistId();
      if (intended && !this.performingTherapistId()) {
        this.performingTherapistId.set(intended);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.pickerCloseTimer) {
        clearTimeout(this.pickerCloseTimer);
      }
    });
  }

  onSearchFocus(): void {
    if (this.pickerCloseTimer) {
      clearTimeout(this.pickerCloseTimer);
      this.pickerCloseTimer = null;
    }
    this.openTreatmentPicker();
  }

  onSearchBlur(): void {
    this.pickerCloseTimer = setTimeout(() => this.closeTreatmentPicker(), 200);
  }

  onDropdownOutsideClick(): void {
    this.closeTreatmentPicker();
  }

  selectTreatment(id: string, event: Event): void {
    event.preventDefault();
    if (this.pickerCloseTimer) {
      clearTimeout(this.pickerCloseTimer);
      this.pickerCloseTimer = null;
    }
    this.addTreatment(id);
  }

  openTreatmentPicker(): void {
    this.treatmentPickerOpen.set(true);
  }

  closeTreatmentPicker(): void {
    this.treatmentPickerOpen.set(false);
  }

  onTreatmentSearchChange(value: string): void {
    this.treatmentSearch.set(value);
    this.treatmentPickerOpen.set(true);
  }

  addTreatment(id: string): void {
    const current = this.selectedTreatmentIds();
    if (current.includes(id)) return;
    this.selectedTreatmentIds.set([...current, id]);
    this.treatmentSearch.set('');
    this.treatmentPickerOpen.set(true);
  }

  removeTreatment(id: string): void {
    this.selectedTreatmentIds.set(this.selectedTreatmentIds().filter((item) => item !== id));
  }

  addCustomTreatment(event?: Event): void {
    event?.preventDefault();
    const value = this.customTreatmentDraft().trim();
    if (!this.addCustomTreatmentValue(value)) return;
    this.customTreatmentDraft.set('');
  }

  addCustomFromSearch(event: Event): void {
    event.preventDefault();
    if (this.pickerCloseTimer) {
      clearTimeout(this.pickerCloseTimer);
      this.pickerCloseTimer = null;
    }
    const value = this.treatmentSearch().trim();
    if (!this.addCustomTreatmentValue(value)) return;
    this.treatmentSearch.set('');
    this.closeTreatmentPicker();
  }

  removeCustomTreatment(name: string): void {
    this.otherTreatments.set(this.otherTreatments().filter((item) => item !== name));
  }

  async submit(): Promise<void> {
    const id = this.consultationId();
    const performingTherapistId = this.performingTherapistId();
    if (!id || !performingTherapistId || !this.canSubmit()) return;

    this.loading.set(true);
    this.error.set('');
    try {
      await this.consultationsSvc.completeConsentForm(id, {
        performingTherapistId,
        treatmentIds: this.selectedTreatmentIds(),
        treatmentOthers: this.otherTreatments(),
      });
      this.completed.emit();
    } catch {
      this.error.set('Could not complete this consent form. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private addCustomTreatmentValue(value: string): boolean {
    const normalized = value.trim();
    if (!normalized) return false;

    const duplicateCustom = this.otherTreatments().some(
      (name) => name.localeCompare(normalized, undefined, { sensitivity: 'accent' }) === 0,
    );
    if (duplicateCustom) return false;

    const duplicateCatalog = this.selectedTreatments().some(
      (treatment) => treatment.name.localeCompare(normalized, undefined, { sensitivity: 'accent' }) === 0,
    );
    if (duplicateCatalog) return false;

    this.otherTreatments.set([...this.otherTreatments(), normalized]);
    return true;
  }
}
