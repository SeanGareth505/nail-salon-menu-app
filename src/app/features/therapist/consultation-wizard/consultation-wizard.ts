import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, of, switchMap } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import { Storage } from '@angular/fire/storage';

import { ClientsService } from '../../../core/services/clients.service';
import { ConsentTemplatesService } from '../../../core/services/consent-templates.service';
import { ConsentTemplateVersionsService } from '../../../core/services/consent-template-versions.service';
import { ConsentSubmissionsService } from '../../../core/services/consent-submissions.service';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AuditService } from '../../../core/services/audit.service';
import { NotificationDispatcherService } from '../../../core/services/notification-dispatcher.service';
import { PwaService } from '../../../core/pwa/pwa.service';
import { TherapistConsultationUiService } from '../../../core/services/therapist-consultation-ui.service';
import { isFieldVisible } from '../../../core/consent/condition-evaluator';
import {
  DEFAULT_CONSENT_FIELDS,
  DEFAULT_CONSENT_STEPS,
  DEFAULT_CONSENT_TEMPLATE_ID,
  DEFAULT_CONSENT_VERSION_ID,
} from '../../../core/consent/default-consent-template';
import { Client, ConsentField, ConsentStepDefinition, ConsentTemplateVersion } from '../../../core/models';
import { clientFullName, normalizeClientNames, splitClientName } from '../../../core/utils/client-name.util';
import { isValidEmail, formatEmailInput } from '../../../core/utils/email.util';
import { formatPhoneInput, isValidPhone, normalizePhoneKey } from '../../../core/utils/phone.util';
import { duplicateClientMessage, findClientDuplicate, ClientDuplicateError } from '../../../core/utils/client-validation.util';
import {
  clearConsentFormDraft,
  loadConsentFormDraft,
  saveConsentFormDraft,
} from '../../../core/utils/consent-form-draft.storage';

import { SfIcon } from '../../../shared/components/icon/icon';
import { SfDynamicField } from '../../../shared/components/dynamic-field/dynamic-field';
import { SfSignaturePad } from '../../../shared/components/signature-pad/signature-pad';
import { SfPhoneMaskDirective } from '../../../shared/directives/phone-mask.directive';
import { SfEmailMaskDirective } from '../../../shared/directives/email-mask.directive';
import { expandCollapse, wizardStep } from '../../../shared/animations/motion.animations';

type Phase = 'setup' | 'wizard' | 'saving' | 'complete';

interface ReviewRow {
  label: string;
  value: string;
  flagged: boolean;
}

interface ReviewGroup {
  key: string;
  name: string;
  rows: ReviewRow[];
}

const AVATAR_PALETTES = [
  { bg: '#F7E9E3', fg: '#8A5A5A' },
  { bg: '#FDF3E7', fg: '#8A6A2E' },
  { bg: '#F0F4F0', fg: '#4A6B57' },
];

interface SetupTouched {
  firstName: boolean;
  lastName: boolean;
  phone: boolean;
  email: boolean;
}

const SETUP_TOUCHED_INITIAL: SetupTouched = {
  firstName: false,
  lastName: false,
  phone: false,
  email: false,
};

const SETUP_CAPTURED_FIELD_KEYS = new Set(['first_name', 'last_name', 'phone', 'email']);
const SETUP_SKIPPED_STEP_KEYS = new Set(['details', 'consent_notes']);
const CONSENT_COMMENTS_KEY = 'consent_notes';
const CONSENT_FORM_STEP_KEY = 'consent_form';
const WIZARD_META_STEP_KEYS = new Set([CONSENT_FORM_STEP_KEY, 'review', 'therapist_review']);

interface ConsentFormSection {
  key: string;
  title: string;
  fields: ConsentField[];
}

@Component({
  selector: 'app-consultation-wizard',
  standalone: true,
  imports: [A11yModule, FormsModule, RouterLink, DatePipe, SfIcon, SfDynamicField, SfSignaturePad, SfPhoneMaskDirective, SfEmailMaskDirective],
  providers: [DatePipe],
  templateUrl: './consultation-wizard.html',
  styleUrl: './consultation-wizard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [wizardStep, expandCollapse],
})
export class ConsultationWizard implements OnDestroy {
  private readonly clientsSvc = inject(ClientsService);
  private readonly templatesSvc = inject(ConsentTemplatesService);
  private readonly versionsSvc = inject(ConsentTemplateVersionsService);
  private readonly submissionsSvc = inject(ConsentSubmissionsService);
  private readonly consultationsSvc = inject(ConsultationsService);
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  readonly auth = inject(AuthService);
  private readonly audit = inject(AuditService);
  private readonly dispatcher = inject(NotificationDispatcherService);
  private readonly storage = inject(Storage);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly pwa = inject(PwaService);
  private readonly shellUi = inject(TherapistConsultationUiService);
  private readonly datePipe = inject(DatePipe);

  readonly phase = signal<Phase>('setup');
  readonly completeTime = signal<string | null>(null);

  readonly clients = toSignal(this.clientsSvc.listAll(), { initialValue: [] as Client[] });
  readonly therapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });
  readonly clientSearch = signal('');
  readonly selectedClientId = signal<string | null>(null);
  readonly intendedTreatmentId = signal<string | null>(null);
  readonly clientFirstName = signal('');
  readonly clientLastName = signal('');
  readonly clientPhone = signal('');
  readonly clientEmail = signal('');
  readonly intendedTherapistId = signal<string | null>(null);
  readonly setupError = signal('');
  readonly setupTouched = signal<SetupTouched>({ ...SETUP_TOUCHED_INITIAL });
  readonly editingClientDetails = signal(false);

  readonly selectedClientKey = computed(() => this.selectedClientId());

  readonly clientSubmissions = toSignal(
    toObservable(this.selectedClientKey).pipe(
      switchMap((clientId) => (clientId ? this.submissionsSvc.listForClient(clientId) : of([]))),
    ),
    { initialValue: [] },
  );

  readonly lastSignedConsentVersion = computed(() => {
    const match = this.clientSubmissions().find(
      (submission) => submission.templateId === DEFAULT_CONSENT_TEMPLATE_ID && submission.status === 'complete',
    );
    return match?.templateVersionNumber ?? null;
  });

  readonly filteredClients = computed(() => {
    const term = this.clientSearch().trim().toLowerCase();
    const pool = !term
      ? this.clients()
      : this.clients().filter((c) => {
          const names = splitClientName(c);
          const full = clientFullName(names.firstName, names.lastName);
          return (
            full.toLowerCase().includes(term) ||
            names.firstName.toLowerCase().includes(term) ||
            names.lastName.toLowerCase().includes(term) ||
            c.phone.replace(/\s/g, '').includes(term.replace(/\s/g, '')) ||
            c.email.toLowerCase().includes(term)
          );
        });
    return pool.slice(0, 8);
  });

  readonly intendedTherapist = computed(
    () => this.therapists().find((t) => t.id === this.intendedTherapistId()) ?? null,
  );

  readonly intendedTreatment = computed(
    () => this.treatments().find((t) => t.id === this.intendedTreatmentId()) ?? null,
  );

  readonly setupClient = computed(() => {
    const id = this.selectedClientId();
    if (!id) return null;
    return this.clients().find((c) => c.id === id) ?? null;
  });

  readonly setupSummary = computed(() => {
    const selected = this.setupClient();
    const client = selected?.fullName || clientFullName(this.clientFirstName(), this.clientLastName()) || 'no client selected';
    const therapist = this.intendedTherapist()?.name ?? 'therapist not selected yet';
    return `${client} · ${therapist}`;
  });

  readonly isReturningClientLocked = computed(
    () => !!this.selectedClientId() && !this.editingClientDetails(),
  );

  readonly canBegin = computed(() =>
    !!(this.selectedClientId() || this.editingClientDetails()) && this.isClientFormValid(),
  );

  readonly setupBlockedReason = computed(() => {
    if (this.canBegin()) return '';
    if (!this.selectedClientId() && !this.editingClientDetails()) return 'Choose a client or add a new client to continue.';

    const duplicate = this.activeClientDuplicate();
    if (duplicate) {
      if (this.isReturningClientLocked()) {
        return `${duplicateClientMessage(duplicate)} Update this client's profile before continuing.`;
      }
      return duplicateClientMessage(duplicate);
    }

    if (this.isReturningClientLocked()) {
      const client = this.setupClient();
      if (client) {
        const reason = this.clientBlockedReason(client);
        if (reason) return reason;
      }
    }

    if (this.matchingExistingClient()) {
      return `This matches ${this.matchingExistingClient()!.fullName}. Select them from search instead.`;
    }

    if (!this.clientFirstName().trim() || !this.clientLastName().trim()) {
      return 'Enter name and surname.';
    }
    if (!isValidPhone(this.clientPhone())) {
      return 'Enter a valid phone number (e.g. 082 123 4567).';
    }
    if (!isValidEmail(this.clientEmail())) {
      return 'Enter a valid email address.';
    }

    return '';
  });

  readonly clientDuplicate = computed(() =>
    findClientDuplicate(this.clients(), {
      phone: this.clientPhone(),
      email: this.clientEmail(),
      excludeId: this.selectedClientId(),
    }),
  );

  readonly activeClientDuplicate = computed(() => {
    if (this.isReturningClientLocked()) {
      const client = this.setupClient();
      if (!client) return null;
      return findClientDuplicate(this.clients(), {
        phone: client.phone,
        email: client.email,
        excludeId: client.id,
      });
    }
    return this.clientDuplicate();
  });

  readonly matchingExistingClient = computed(() => {
    if (this.selectedClientId()) return null;

    const phone = this.clientPhone();
    if (isValidPhone(phone)) {
      const phoneKey = normalizePhoneKey(phone);
      const match = this.clients().find((client) => normalizePhoneKey(client.phone) === phoneKey);
      if (match) return match;
    }

    const email = formatEmailInput(this.clientEmail());
    if (isValidEmail(email)) {
      const match = this.clients().find(
        (client) => formatEmailInput(client.email) && formatEmailInput(client.email) === email,
      );
      if (match) return match;
    }

    return null;
  });

  readonly setupFieldErrors = computed(() => {
    if (this.isReturningClientLocked()) return {};

    const touched = this.setupTouched();
    const errors: Partial<Record<keyof SetupTouched, string>> = {};
    if (touched.firstName && !this.clientFirstName().trim()) {
      errors.firstName = 'Name is required.';
    }
    if (touched.lastName && !this.clientLastName().trim()) {
      errors.lastName = 'Surname is required.';
    }
    if (touched.phone && !isValidPhone(this.clientPhone())) {
      errors.phone = 'Enter a valid phone number (e.g. 082 123 4567).';
    } else if (touched.phone && isValidPhone(this.clientPhone())) {
      const duplicate = this.clientDuplicate();
      if (duplicate?.field === 'phone' && (this.selectedClientId() || !this.matchingExistingClient())) {
        errors.phone = duplicateClientMessage(duplicate);
      }
    }
    if (touched.email && !isValidEmail(this.clientEmail())) {
      errors.email = 'Enter a valid email address.';
    } else if (touched.email && isValidEmail(this.clientEmail())) {
      const duplicate = this.clientDuplicate();
      if (duplicate?.field === 'email' && (this.selectedClientId() || !this.matchingExistingClient())) {
        errors.email = duplicateClientMessage(duplicate);
      }
    }
    return errors;
  });

  readonly client = signal<Client | null>(null);
  readonly templateVersion = signal<ConsentTemplateVersion | null>(null);
  readonly answers = signal<Record<string, unknown>>({});
  readonly signatureDataUrl = signal<string | null>(null);
  readonly stepIndex = signal(0);
  readonly saveError = signal('');
  readonly therapistReviewed = signal(false);
  readonly submitConfirmOpen = signal(false);
  readonly exitConfirmOpen = signal(false);
  readonly missingRequiredFields = computed(() => {
    const answers = this.answers();
    return (this.templateVersion()?.fields ?? [])
      .filter(f => f.step && !SETUP_SKIPPED_STEP_KEYS.has(f.step) && f.key !== CONSENT_COMMENTS_KEY)
      .filter(f => !['information', 'warning'].includes(f.type) && f.required && isFieldVisible(f, answers))
      .filter(f => !this.isFieldValid(f, answers[f.key]));
  });
  readonly completionHint = computed(() => {
    const missing = this.missingRequiredFields().length;
    if (missing) return `${missing} required ${missing === 1 ? 'answer' : 'answers'} remaining${this.signatureDataUrl() ? '' : ' · signature needed'}`;
    if (!this.signatureDataUrl()) return 'Add your signature to continue';
    return 'All set. Review your answers next.';
  });

  readonly steps = computed<ConsentStepDefinition[]>(() => {
    const tail: ConsentStepDefinition[] = [
      { key: CONSENT_FORM_STEP_KEY, title: 'Consent form', sortOrder: 1 },
      { key: 'review', title: 'Review', sortOrder: 1000 },
    ];
    if (this.flaggedReviewCount() > 0) {
      tail.push({ key: 'therapist_review', title: 'Therapist review', sortOrder: 1001 });
    }
    return tail;
  });

  readonly consentFormSections = computed<ConsentFormSection[]>(() => {
    const v = this.templateVersion();
    if (!v) return [];
    const answers = this.answers();
    return v.steps
      .filter((step) => !SETUP_SKIPPED_STEP_KEYS.has(step.key))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((step) => ({
        key: step.key,
        title: step.title,
        fields: v.fields
          .filter((f) => f.step === step.key)
          .filter((f) => f.key !== CONSENT_COMMENTS_KEY)
          .filter((f) => isFieldVisible(f, answers))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .filter((section) => section.fields.length > 0);
  });

  readonly currentStep = computed(() => this.steps()[this.stepIndex()] ?? null);

  readonly allDataFields = computed<ConsentField[]>(() => {
    const v = this.templateVersion();
    if (!v) return [];
    return v.fields.filter((f) => !['information', 'warning'].includes(f.type));
  });

  readonly reviewGroups = computed<ReviewGroup[]>(() => {
    const v = this.templateVersion();
    if (!v) return [];
    const answers = this.answers();
    return v.steps
      .filter((step) => !WIZARD_META_STEP_KEYS.has(step.key))
      .map((step) => ({
        key: step.key,
        name: step.title,
        rows: v.fields
          .filter((f) => f.step === step.key && !['information', 'warning', 'signature', 'image'].includes(f.type))
          .filter((f) => f.key !== CONSENT_COMMENTS_KEY)
          .filter((f) => isFieldVisible(f, answers))
          .filter((f) => this.hasValue(answers[f.key]))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((f) => ({
            label: f.label,
            value: this.formatReviewValue(f, answers[f.key]),
            flagged: this.isFlaggedAnswer(f, answers),
          })),
      }))
      .filter((group) => group.rows.length > 0);
  });

  readonly flaggedReviewGroups = computed(() =>
    this.reviewGroups()
      .map((group) => ({
        ...group,
        rows: group.rows.filter((row) => row.flagged),
      }))
      .filter((group) => group.rows.length > 0),
  );

  readonly flaggedReviewCount = computed(() =>
    this.flaggedReviewGroups().reduce((count, group) => count + group.rows.length, 0),
  );

  readonly canContinue = computed(() => {
    const step = this.currentStep();
    if (!step) return false;
    if (step.key === CONSENT_FORM_STEP_KEY) {
      return this.isConsentFormComplete();
    }
    if (step.key === 'review') return true;
    if (step.key === 'therapist_review') {
      return this.flaggedReviewCount() === 0 || this.therapistReviewed();
    }
    return false;
  });

  readonly queryClientId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('client'))),
    { initialValue: null as string | null },
  );

  readonly completeFormLabel = computed(() => this.templateVersion()?.templateId ?? 'consent form');

  private restoredFromDraft = false;

  constructor() {
    this.restoredFromDraft = this.tryRestoreDraft();

    if (!this.restoredFromDraft) {
      this.pwa.setConsultationActive(true);
      this.syncChrome('setup');
    }

    effect(() => {
      if (this.restoredFromDraft) return;
      const clientId = this.queryClientId();
      if (!clientId || !this.clients().length) return;
      if (this.selectedClientId() === clientId) return;
      this.selectExistingClient(clientId);
    });

    this.route.queryParamMap.subscribe((params) => {
      if (this.restoredFromDraft) return;
      const treatmentId = params.get('treatment');
      if (treatmentId) {
        this.intendedTreatmentId.set(treatmentId);
      }
    });

    effect(() => this.persistDraft());
  }

  ngOnDestroy(): void {
    this.pwa.setConsultationActive(false);
    this.shellUi.setHideChrome(false);
  }

  avatarBg(name: string): string {
    return AVATAR_PALETTES[this.paletteIndex(name)].bg;
  }

  avatarFg(name: string): string {
    return AVATAR_PALETTES[this.paletteIndex(name)].fg;
  }

  lastVisit(client: Client): string {
    if (!client.lastConsultationAt) return '—';
    return this.datePipe.transform(client.lastConsultationAt, 'd MMM y') ?? '—';
  }

  returningConsentDate(client: Client): string {
    return this.lastVisit(client);
  }

  onClientSearchChange(value: string): void {
    if (this.selectedClientId()) {
      this.selectedClientId.set(null);
    }
    this.editingClientDetails.set(false);
    this.clientSearch.set(value);
  }

  selectExistingClient(id: string): void {
    const client = this.clients().find((c) => c.id === id);
    if (!client) return;
    this.selectedClientId.set(id);
    this.editingClientDetails.set(false);
    this.applyClientToForm(client);
    this.clientSearch.set('');
    this.setupError.set('');
    this.setupTouched.set({ ...SETUP_TOUCHED_INITIAL });

    if (!this.isSelectedClientReady(client)) {
      this.editingClientDetails.set(true);
      this.markAllSetupTouched();
      this.setupError.set(this.clientBlockedReason(client) || 'Complete the required client details to continue.');
    }
  }

  startNewClient(): void {
    this.selectedClientId.set(null);
    this.editingClientDetails.set(false);
    this.clientFirstName.set('');
    this.clientLastName.set('');
    this.clientPhone.set('');
    this.clientEmail.set('');
    this.clientSearch.set('');
    this.setupError.set('');
    this.setupTouched.set({ ...SETUP_TOUCHED_INITIAL });
  }

  beginNewClientForm(): void {
    this.selectedClientId.set(null);
    this.editingClientDetails.set(true);
    this.clientFirstName.set('');
    this.clientLastName.set('');
    this.clientPhone.set('');
    this.clientEmail.set('');
    this.clientSearch.set('');
    this.setupError.set('');
    this.setupTouched.set({ ...SETUP_TOUCHED_INITIAL });
  }

  enableEditClientDetails(): void {
    const client = this.setupClient();
    if (!client) return;
    this.editingClientDetails.set(true);
    this.applyClientToForm(client);
    this.setupError.set('');
    this.setupTouched.set({ ...SETUP_TOUCHED_INITIAL });
  }

  cancelEditClientDetails(): void {
    const client = this.setupClient();
    if (!client) return;
    this.editingClientDetails.set(false);
    this.applyClientToForm(client);
    this.setupError.set('');
    this.setupTouched.set({ ...SETUP_TOUCHED_INITIAL });
  }

  touchSetupField(field: keyof SetupTouched): void {
    this.setupTouched.update((current) => ({ ...current, [field]: true }));
  }

  onClientPhoneInput(value: string): void {
    this.clientPhone.set(formatPhoneInput(value));
    this.setupError.set('');
  }

  onClientEmailInput(value: string): void {
    this.clientEmail.set(formatEmailInput(value));
    this.setupError.set('');
  }

  markAllSetupTouched(): void {
    this.setupTouched.set({
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
    });
  }

  fieldValue(key: string): unknown {
    return this.answers()[key] ?? null;
  }

  setFieldValue(key: string, value: unknown): void {
    this.answers.update((a) => ({ ...a, [key]: value }));
  }

  consentComments(): string {
    return String(this.fieldValue(CONSENT_COMMENTS_KEY) ?? '');
  }

  setConsentComments(value: string): void {
    this.setFieldValue(CONSENT_COMMENTS_KEY, value);
  }

  stepLabel(step: ConsentStepDefinition): string {
    return step.title;
  }

  goToStep(index: number): void {
    if (index <= this.stepIndex()) this.stepIndex.set(index);
  }

  editReviewGroup(_stepKey: string): void {
    const index = this.steps().findIndex((step) => step.key === CONSENT_FORM_STEP_KEY);
    if (index >= 0) this.stepIndex.set(index);
  }

  toggleTherapistReviewed(): void {
    this.therapistReviewed.update((value) => !value);
  }

  requestExit(): void { this.exitConfirmOpen.set(true); }

  async exitConsentForm(): Promise<void> {
    this.persistDraft();
    this.pwa.setConsultationActive(false);
    await this.router.navigate(['/therapist']);
  }

  isNextExistingClient(): boolean {
    return !!this.selectedClientId();
  }

  async beginConsentForm(): Promise<void> {
    this.setupError.set('');
    if (!this.isReturningClientLocked()) {
      this.markAllSetupTouched();
    }
    if (!this.canBegin()) {
      this.setupError.set(this.setupBlockedReason());
      return;
    }

    try {
      let resolved: Client;
      if (this.isReturningClientLocked()) {
        const existing = this.setupClient();
        if (!existing) return;
        resolved = existing;
      } else {
        resolved = await this.clientsSvc.upsertClient({
          id: this.selectedClientId(),
          firstName: this.clientFirstName().trim(),
          lastName: this.clientLastName().trim(),
          phone: this.clientPhone().trim(),
          email: this.clientEmail().trim(),
        });

        if (!this.selectedClientId()) {
          void this.dispatcher.notifyAdmins({
            type: 'client_created',
            title: 'New client added',
            body: `${resolved.fullName} was added during a consent form.`,
            link: `/admin/clients/${resolved.id}`,
            entityType: 'client',
            entityId: resolved.id,
          }).catch(() => undefined);
        }
      }

      this.client.set({ ...resolved, active: true } as Client);
      await this.loadDefaultTemplate();

      const prefill: Record<string, unknown> = {};
      const identity = normalizeClientNames({
        firstName: this.clientFirstName(),
        lastName: this.clientLastName(),
        fullName: clientFullName(this.clientFirstName(), this.clientLastName()),
      });
      prefill['first_name'] = identity.firstName;
      prefill['last_name'] = identity.lastName;
      prefill['phone'] = this.clientPhone().trim();
      prefill['email'] = this.clientEmail().trim();
      this.answers.set(prefill);

      this.stepIndex.set(0);
      this.therapistReviewed.set(false);
      this.setPhase('wizard');
      this.pwa.setConsultationActive(true);
    } catch (err) {
      if (err instanceof ClientDuplicateError) {
        this.setupError.set(err.message);
        return;
      }
      this.setupError.set('Could not save client details. Please try again.');
    }
  }

  private async loadDefaultTemplate(): Promise<void> {
    const template = await new Promise<any>((resolve) => {
      const sub = this.templatesSvc.get(DEFAULT_CONSENT_TEMPLATE_ID).subscribe((t) => {
        resolve(t);
        sub.unsubscribe();
      });
    });
    if (template?.currentPublishedVersionId) {
      const version = await new Promise<any>((resolve) => {
        const sub = this.versionsSvc.get(template.currentPublishedVersionId).subscribe((v) => {
          resolve(v);
          sub.unsubscribe();
        });
      });
      this.templateVersion.set(version ?? this.fallbackVersion());
      return;
    }
    this.templateVersion.set(this.fallbackVersion());
  }

  private fallbackVersion(): ConsentTemplateVersion {
    return {
      id: DEFAULT_CONSENT_VERSION_ID,
      templateId: DEFAULT_CONSENT_TEMPLATE_ID,
      versionNumber: 1,
      status: 'published',
      publishedAt: null,
      publishedBy: null,
      steps: DEFAULT_CONSENT_STEPS,
      fields: DEFAULT_CONSENT_FIELDS,
    } as ConsentTemplateVersion;
  }

  next(): void {
    if (this.stepIndex() < this.steps().length - 1) this.stepIndex.update((i) => i + 1);
  }

  back(): void {
    if (this.stepIndex() > 0) {
      this.stepIndex.update((i) => i - 1);
      return;
    }
    this.pwa.setConsultationActive(false);
    this.setPhase('setup');
  }

  onSignature(dataUrl: string | null): void {
    this.signatureDataUrl.set(dataUrl);
  }

  openSubmitConfirm(): void {
    if (!this.canContinue()) return;
    this.submitConfirmOpen.set(true);
  }

  dismissSubmitConfirm(): void {
    this.submitConfirmOpen.set(false);
  }

  confirmSubmit(): void {
    this.submitConfirmOpen.set(false);
    void this.submit();
  }

  async submit(): Promise<void> {
    const resolved = this.client();
    const version = this.templateVersion();
    const signature = this.signatureDataUrl();
    if (!resolved || !version || !signature) return;

    this.setPhase('saving');
    this.saveError.set('');

    try {
      const intended = this.intendedTherapist();
      const treatment = this.intendedTreatment();
      const signedAt = new Date().toISOString();
      const consentNotes = String(this.answers()[CONSENT_COMMENTS_KEY] ?? '').trim() || null;

      const consultationId = await this.consultationsSvc.create({
        clientId: resolved.id,
        clientName: resolved.fullName,
        treatmentId: treatment?.id ?? null,
        treatmentIds: treatment ? [treatment.id] : [],
        treatmentName: treatment?.name ?? null,
        treatmentNames: treatment ? [treatment.name] : [],
        treatmentOther: null,
        intendedTherapistId: intended?.id ?? null,
        intendedTherapistName: intended?.name ?? null,
        performingTherapistId: null,
        performingTherapistName: null,
        therapistId: intended?.id ?? null,
        therapistName: intended?.name ?? null,
        consentSubmissionId: null,
        consentNotes,
        status: 'pending',
        startedAt: signedAt,
        signedAt,
        completedAt: null,
        currentStep: null,
      } as Omit<import('../../../core/models').Consultation, 'id'>);

      const storageRef = ref(this.storage, `signatures/${consultationId}.png`);
      await uploadString(storageRef, signature, 'data_url');
      const signatureUrl = await getDownloadURL(storageRef);

      const answerList = this.allDataFields().map((f) => ({
        fieldKey: f.key,
        value: this.answers()[f.key] ?? null,
        flagged: this.isFlaggedAnswer(f, this.answers()),
      }));

      const submissionId = await this.submissionsSvc.create({
        consultationId,
        clientId: resolved.id,
        treatmentId: treatment?.id ?? null,
        therapistId: intended?.id ?? null,
        templateId: version.templateId,
        templateVersionId: version.id,
        templateVersionNumber: version.versionNumber,
        answers: answerList,
        signature: { dataUrl: signatureUrl, signedAt, signedByName: resolved.fullName },
        status: 'pending',
        requiresTherapistReview: this.flaggedReviewCount() > 0,
        reviewedBy: this.therapistReviewed() ? this.auth.currentUid() : null,
        reviewedAt: this.therapistReviewed() ? signedAt : null,
        reviewNotes: null,
      } as Omit<import('../../../core/models').ConsentSubmission, 'id'>);

      await this.consultationsSvc.update(consultationId, {
        consentSubmissionId: submissionId,
      } as Partial<import('../../../core/models').Consultation>);

      const snapshot: Record<string, unknown> = {};
      for (const f of this.allDataFields()) {
        if (this.answers()[f.key] !== undefined) snapshot[f.key] = this.answers()[f.key];
      }
      await this.clientsSvc.updateLastKnownAnswers(resolved.id, snapshot);

      await this.audit.log(
        'sign',
        'consentSubmission',
        submissionId,
        `Consent form signed for ${resolved.fullName}`,
      );

      void this.dispatcher.notifyAdmins({
        type: 'consultation_started',
        title: 'Consent form signed',
        body: `${resolved.fullName} signed a consent form (pending review).`,
        link: '/admin/consultations',
        entityType: 'consultation',
        entityId: consultationId,
      }).catch(() => undefined);

      clearConsentFormDraft();
      this.pwa.setConsultationActive(false);
      await this.router.navigate(['/therapist/consent-forms'], {
        queryParams: { highlight: consultationId },
      });
    } catch {
      this.saveError.set('Something went wrong saving this consent form. Please try again.');
      this.setPhase('wizard');
    }
  }

  private applyClientToForm(client: Client): void {
    const normalized = normalizeClientNames(client);
    this.clientFirstName.set(normalized.firstName);
    this.clientLastName.set(normalized.lastName);
    this.clientPhone.set(formatPhoneInput(client.phone ?? ''));
    this.clientEmail.set(formatEmailInput(client.email ?? ''));
  }

  private clientBlockedReason(client: Client): string {
    const names = normalizeClientNames(client);
    if (!names.firstName.trim() || !names.lastName.trim()) {
      return 'This client record is missing a name.';
    }
    if (!isValidPhone(client.phone ?? '')) {
      return 'This client needs a valid phone number.';
    }
    if (!isValidEmail(formatEmailInput(client.email ?? ''))) {
      return 'This client needs a valid email.';
    }
    return '';
  }

  private isSelectedClientReady(client: Client): boolean {
    return !this.clientBlockedReason(client);
  }

  private isClientFormValid(): boolean {
    if (this.isReturningClientLocked()) {
      const client = this.setupClient();
      if (!client || !this.isSelectedClientReady(client)) return false;
      return !this.activeClientDuplicate();
    }

    const hasRequiredFields =
      !!this.clientFirstName().trim() &&
      !!this.clientLastName().trim() &&
      isValidPhone(this.clientPhone()) &&
      isValidEmail(this.clientEmail());

    if (!hasRequiredFields) return false;
    if (!this.selectedClientId() && this.matchingExistingClient()) return false;
    return !this.clientDuplicate();
  }

  private setPhase(phase: Phase): void {
    this.phase.set(phase);
    this.syncChrome(phase);
  }

  private tryRestoreDraft(): boolean {
    const draft = loadConsentFormDraft();
    if (!draft) return false;

    this.selectedClientId.set(draft.selectedClientId);
    this.intendedTreatmentId.set(draft.intendedTreatmentId);
    this.clientFirstName.set(draft.clientFirstName);
    this.clientLastName.set(draft.clientLastName);
    this.clientPhone.set(draft.clientPhone);
    this.clientEmail.set(draft.clientEmail);
    this.intendedTherapistId.set(draft.intendedTherapistId);

    if (draft.phase === 'wizard' && draft.client) {
      this.client.set({
        ...draft.client,
        active: true,
        dateOfBirth: null,
        notes: '',
        lastKnownAnswers: {},
        lastKnownAnswersUpdatedAt: null,
        lastConsultationAt: null,
        totalConsultations: 0,
        createdAt: draft.savedAt,
        updatedAt: draft.savedAt,
        createdBy: null,
        updatedBy: null,
      } as unknown as Client);
      this.answers.set(draft.answers);
      this.signatureDataUrl.set(draft.signatureDataUrl);
      this.stepIndex.set(draft.stepIndex);
      this.therapistReviewed.set(draft.therapistReviewed);
      this.setPhase('wizard');
      this.pwa.setConsultationActive(true);
      void this.loadDefaultTemplate().then(() => {
        const maxStep = Math.max(0, this.steps().length - 1);
        this.stepIndex.set(Math.min(draft.stepIndex, maxStep));
      });
      return true;
    }

    this.editingClientDetails.set(!draft.selectedClientId && !!(draft.clientFirstName || draft.clientPhone || draft.clientEmail));
    this.setPhase('setup');
    this.pwa.setConsultationActive(false);
    return true;
  }

  private persistDraft(): void {
    const phase = this.phase();
    if (phase === 'saving' || phase === 'complete') return;

    const client = this.client();
    saveConsentFormDraft({
      version: 1,
      savedAt: new Date().toISOString(),
      phase: phase === 'wizard' ? 'wizard' : 'setup',
      selectedClientId: this.selectedClientId(),
      intendedTreatmentId: this.intendedTreatmentId(),
      clientFirstName: this.clientFirstName(),
      clientLastName: this.clientLastName(),
      clientPhone: this.clientPhone(),
      clientEmail: this.clientEmail(),
      intendedTherapistId: this.intendedTherapistId(),
      client: client
        ? {
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            fullName: client.fullName,
            phone: client.phone,
            email: client.email,
          }
        : null,
      answers: this.answers(),
      signatureDataUrl: this.signatureDataUrl(),
      stepIndex: this.stepIndex(),
      therapistReviewed: this.therapistReviewed(),
    });
  }

  private syncChrome(phase: Phase): void {
    this.shellUi.setHideChrome(phase === 'wizard' || phase === 'saving');
  }

  private formatReviewValue(field: ConsentField, value: unknown): string {
    if (Array.isArray(value)) return value.join(', ');
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  }

  private isFlaggedAnswer(field: ConsentField, answers: Record<string, unknown>): boolean {
    const value = answers[field.key];
    if (field.key === 'retinoid_use' && (value === 'yes' || value === 'unsure')) return true;
    const warning = this.templateVersion()?.fields.find(
      (f) => f.type === 'warning' && f.conditions?.some((c) => c.dependsOn === field.key),
    );
    if (!warning) return false;
    return isFieldVisible(warning, answers);
  }

  private isConsentFormComplete(): boolean {
    const v = this.templateVersion();
    if (!v || !this.signatureDataUrl()) return false;
    const answers = this.answers();
    return v.fields
      .filter((f) => f.step && !SETUP_SKIPPED_STEP_KEYS.has(f.step))
      .filter((f) => f.key !== CONSENT_COMMENTS_KEY)
      .filter((f) => !['information', 'warning'].includes(f.type))
      .filter((f) => isFieldVisible(f, answers))
      .filter((f) => f.required)
      .every((f) => this.isFieldValid(f, answers[f.key]));
  }

  private isFieldValid(field: ConsentField, value: unknown): boolean {
    if (!this.hasValue(value)) return false;
    if (field.type === 'email' && typeof value === 'string') return isValidEmail(value);
    if (field.type === 'phone' && typeof value === 'string') return isValidPhone(value);
    return true;
  }

  private hasValue(v: unknown): boolean {
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }

  private paletteIndex(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_PALETTES.length;
    return hash;
  }
}
