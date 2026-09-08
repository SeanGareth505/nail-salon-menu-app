import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { toObservable, toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, map, of, switchMap } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import { Storage } from '@angular/fire/storage';

import { ClientsService } from '@core/services/clients.service';
import { SalonIdentityService } from '@core/services/salon-identity.service';
import { SalonSettingsService } from '@core/services/salon-settings.service';
import { ConsentTemplatesService } from '@core/services/consent-templates.service';
import { ConsentTemplateVersionsService } from '@core/services/consent-template-versions.service';
import { ConsentSubmissionsService } from '@core/services/consent-submissions.service';
import { ConsultationsService } from '@core/services/consultations.service';
import { TherapistsService } from '@core/services/therapists.service';
import { TreatmentsService } from '@core/services/treatments.service';
import { AuthService } from '@core/auth/auth.service';
import { AuditService } from '@core/services/audit.service';
import { NotificationDispatcherService } from '@core/services/notification-dispatcher.service';
import { PwaService } from '@core/pwa/pwa.service';
import { TherapistConsultationUiService } from '@core/services/therapist-consultation-ui.service';
import { DefaultConsentTemplateService } from '@core/services/default-consent-template.service';
import { isFieldVisible } from '@core/consent/condition-evaluator';
import { requiresTherapistSignoff } from '@core/consent/therapist-signoff';
import {
  BUILT_IN_CONSENT_TEMPLATES,
  DEFAULT_CONSENT_TEMPLATE_ID,
  DEFAULT_CONSENT_VERSION_ID,
  PREVIOUS_DEFAULT_CONSENT_TEMPLATE,
  canUpgradeBuiltInConsentTemplate,
  resolveBundledConsentVersion,
} from '@core/consent/default-consent-template';
import {
  Client,
  ConsentField,
  ConsentStepDefinition,
  ConsentTemplate,
  ConsentTemplateVersion,
  isConsentFormLive,
} from '@core/models';
import {
  clientFullName,
  normalizeClientNames,
  splitClientName,
} from '@core/utils/client-name.util';
import { isValidEmail, formatEmailInput } from '@core/utils/email.util';
import { formatPhoneInput, isValidPhone, normalizePhoneKey } from '@core/utils/phone.util';
import {
  duplicateClientMessage,
  findClientDuplicate,
  ClientDuplicateError,
} from '@core/utils/client-validation.util';
import {
  clearConsentFormDraft,
  loadConsentFormDraft,
  saveConsentFormDraft,
} from '@core/utils/consent-form-draft.storage';

import { SfIcon } from '@shared/components/icon/icon';
import { SfDynamicField } from '@shared/components/dynamic-field/dynamic-field';
import { SfSignaturePad } from '@shared/components/signature-pad/signature-pad';
import { SfPhoneMaskDirective } from '@shared/directives/phone-mask.directive';
import { SfEmailMaskDirective } from '@shared/directives/email-mask.directive';
import { expandCollapse, wizardStep } from '@shared/animations/motion.animations';

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
  { bg: 'var(--sf-blush)', fg: 'var(--sf-blush-fg)' },
  { bg: 'var(--sf-champagne-light)', fg: 'var(--sf-champagne-ink)' },
  { bg: 'var(--sf-canvas)', fg: 'var(--sf-forest-dark)' },
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
const SIGNATURE_STEP_KEY = 'signature';
const WIZARD_META_STEP_KEYS = new Set([CONSENT_FORM_STEP_KEY, SIGNATURE_STEP_KEY, 'review', 'therapist_review']);

interface ConsentFormSection {
  key: string;
  title: string;
  subtitle?: string;
  fields: ConsentField[];
}

@Component({
  selector: 'app-consultation-wizard',
  standalone: true,
  imports: [
    A11yModule,
    FormsModule,
    RouterLink,
    DatePipe,
    SfIcon,
    SfDynamicField,
    SfSignaturePad,
    SfPhoneMaskDirective,
    SfEmailMaskDirective,
  ],
  providers: [DatePipe],
  templateUrl: './consultation-wizard.html',
  styleUrl: './consultation-wizard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [wizardStep, expandCollapse],
})
export class ConsultationWizard implements OnDestroy {
  private readonly clientsSvc = inject(ClientsService);
  private readonly salonIdentity = inject(SalonIdentityService);
  private readonly salonSettingsSvc = inject(SalonSettingsService);
  private readonly templatesSvc = inject(ConsentTemplatesService);
  private readonly versionsSvc = inject(ConsentTemplateVersionsService);
  private readonly submissionsSvc = inject(ConsentSubmissionsService);
  private readonly consultationsSvc = inject(ConsultationsService);
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly defaultConsentSvc = inject(DefaultConsentTemplateService);
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
  readonly consentTemplates = toSignal(this.templatesSvc.listAll(), { initialValue: [] as ConsentTemplate[] });
  readonly salonSettings = toSignal(this.salonSettingsSvc.get(), { initialValue: undefined });
  readonly clientSearch = signal('');
  readonly selectedClientId = signal<string | null>(null);
  readonly selectedTemplateId = signal<string | null>(DEFAULT_CONSENT_TEMPLATE_ID);
  readonly intendedTreatmentId = signal<string | null>(null);
  readonly clientFirstName = signal('');
  readonly clientLastName = signal('');
  readonly clientPhone = signal('');
  readonly clientEmail = signal('');
  readonly intendedTherapistId = signal<string | null>(null);
  readonly setupError = signal('');
  readonly starting = signal(false);
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
    const templateId = this.selectedTemplateId();
    const match = this.clientSubmissions().find(
      (submission) =>
        submission.templateId === templateId && submission.status === 'complete',
    );
    return match?.templateVersionNumber ?? null;
  });

  readonly liveFormOptions = computed(() => {
    const fromFirestore = this.consentTemplates().filter((template) => isConsentFormLive(template));
    if (fromFirestore.length) {
      return [...fromFirestore].sort((a, b) => {
        if (a.isSystemDefault && !b.isSystemDefault) return -1;
        if (!a.isSystemDefault && b.isSystemDefault) return 1;
        return a.name.localeCompare(b.name);
      });
    }
    return BUILT_IN_CONSENT_TEMPLATES.map((manifest) => ({
      id: manifest.templateId,
      name: manifest.name,
      description: manifest.description,
      treatmentIds: [] as string[],
      currentPublishedVersionId: manifest.versionId,
      draftVersionId: null,
      active: true,
      isSystemDefault: manifest.templateId === DEFAULT_CONSENT_TEMPLATE_ID,
      createdAt: null,
      createdBy: null,
      updatedAt: null,
      updatedBy: null,
    }) satisfies ConsentTemplate);
  });

  readonly selectedFormOption = computed(
    () => this.liveFormOptions().find((template) => template.id === this.selectedTemplateId()) ?? null,
  );

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
    const client =
      selected?.fullName ||
      clientFullName(this.clientFirstName(), this.clientLastName()) ||
      'no client selected';
    const therapist = this.intendedTherapist()?.name ?? 'therapist not selected yet';
    return `${client} · ${therapist}`;
  });

  readonly isReturningClientLocked = computed(
    () => !!this.selectedClientId() && !this.editingClientDetails(),
  );

  readonly canBegin = computed(
    () =>
      !!(this.selectedClientId() || this.editingClientDetails()) &&
      this.isClientFormValid() &&
      !!this.selectedTemplateId() &&
      !!this.selectedFormOption(),
  );

  readonly setupBlockedReason = computed(() => {
    if (this.canBegin()) return '';
    if (!this.liveFormOptions().length) {
      return 'No live consent forms are available. Ask an admin to mark a form as Live.';
    }
    if (!this.selectedTemplateId() || !this.selectedFormOption()) {
      return 'Choose a live consent form to continue.';
    }
    if (!this.selectedClientId() && !this.editingClientDetails())
      return 'Choose a client or add a new client to continue.';

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
      if (
        duplicate?.field === 'phone' &&
        (this.selectedClientId() || !this.matchingExistingClient())
      ) {
        errors.phone = duplicateClientMessage(duplicate);
      }
    }
    if (touched.email && !isValidEmail(this.clientEmail())) {
      errors.email = 'Enter a valid email address.';
    } else if (touched.email && isValidEmail(this.clientEmail())) {
      const duplicate = this.clientDuplicate();
      if (
        duplicate?.field === 'email' &&
        (this.selectedClientId() || !this.matchingExistingClient())
      ) {
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
  readonly validationAttempted = signal(false);
  readonly missingRequiredFields = computed(() => {
    const answers = this.answers();
    return (this.templateVersion()?.fields ?? [])
      .filter(
        (f) => f.step && !SETUP_SKIPPED_STEP_KEYS.has(f.step) && f.key !== CONSENT_COMMENTS_KEY,
      )
      .filter(
        (f) =>
          !['information', 'warning'].includes(f.type) && f.required && isFieldVisible(f, answers),
      )
      .filter((f) => !this.isFieldValid(f, answers[f.key]));
  });
  readonly completionHint = computed(() => {
    const section = this.currentSection();
    if (section) {
      const missing = section.fields.filter((field) => field.required && !['information', 'warning'].includes(field.type) && !this.isFieldValid(field, this.answers()[field.key])).length;
      return missing ? `${missing} required ${missing === 1 ? 'answer' : 'answers'} remaining in this section` : 'Section complete. Continue when you are ready.';
    }
    if (this.currentStep()?.key === SIGNATURE_STEP_KEY) {
      return this.signatureDataUrl() ? 'Signature captured. Review your answers next.' : 'Add your signature to continue';
    }
    return 'Your draft is saved on this device';
  });

  readonly usesStaffSignoff = computed(() => {
    const version = this.templateVersion();
    return !!version && requiresTherapistSignoff({ templateId: version.templateId, templateVersionId: version.id, templateVersionNumber: version.versionNumber });
  });

  readonly needsInlineTherapistReview = computed(() => !this.usesStaffSignoff() && this.flaggedReviewCount() > 0);

  readonly steps = computed<ConsentStepDefinition[]>(() => {
    const content = this.consentFormSections().map((section, index) => ({ key: section.key, title: section.title, subtitle: section.subtitle, sortOrder: index + 1 }));
    const tail: ConsentStepDefinition[] = [
      ...content,
      { key: SIGNATURE_STEP_KEY, title: 'Your signature', sortOrder: 999 },
      { key: 'review', title: 'Review', sortOrder: 1000 },
    ];
    if (this.needsInlineTherapistReview()) {
      tail.push({ key: 'therapist_review', title: 'Therapist review', sortOrder: 1001 });
    }
    return tail;
  });

  readonly consentFormSections = computed<ConsentFormSection[]>(() => {
    const v = this.templateVersion();
    if (!v) return [];
    const answers = this.answers();
    return v.steps
      .filter((step) => !SETUP_SKIPPED_STEP_KEYS.has(step.key) && !WIZARD_META_STEP_KEYS.has(step.key))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((step) => ({
        key: step.key,
        title: step.title,
        subtitle: step.subtitle,
        fields: v.fields
          .filter((f) => f.step === step.key)
          .filter((f) => f.key !== CONSENT_COMMENTS_KEY && !['signature', 'image'].includes(f.type))
          .filter((f) => isFieldVisible(f, answers))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .filter((section) => section.fields.length > 0);
  });

  readonly setupTermsPreview = computed(() => {
    const v = this.templateVersion();
    if (!v) return [];
    return v.steps
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((step) => ({
        key: step.key,
        title: step.title,
        fields: v.fields
          .filter(
            (f) =>
              f.step === step.key &&
              (f.type === 'information' || f.type === 'warning') &&
              !!f.bodyText,
          )
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .filter((section) => section.fields.length > 0);
  });

  readonly currentStep = computed(() => this.steps()[this.stepIndex()] ?? null);
  readonly currentSection = computed(() => this.consentFormSections().find((section) => section.key === this.currentStep()?.key) ?? null);

  readonly allDataFields = computed<ConsentField[]>(() => {
    const v = this.templateVersion();
    if (!v) return [];
    return v.fields.filter((f) => !['information', 'warning', 'signature', 'image'].includes(f.type) && isFieldVisible(f, this.answers()));
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
          .filter(
            (f) =>
              f.step === step.key &&
              !['information', 'warning', 'signature', 'image'].includes(f.type),
          )
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
    const section = this.currentSection();
    if (section) return section.fields.every((field) => !field.required || ['information', 'warning'].includes(field.type) || this.isFieldValid(field, this.answers()[field.key]));
    if (step.key === SIGNATURE_STEP_KEY || step.key === 'review') return this.isConsentFormComplete();
    if (step.key === 'therapist_review') return this.isConsentFormComplete() && (this.flaggedReviewCount() === 0 || this.therapistReviewed());
    return false;
  });

  readonly queryClientId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('client'))),
    { initialValue: null as string | null },
  );

  readonly completeFormLabel = computed(
    () => this.selectedFormOption()?.name ?? this.templateVersion()?.templateId ?? 'consent form',
  );

  private restoredFromDraft = false;
  private resumeDraftAfterTemplateLoad = false;
  private draftTemplateVersionId: string | null = null;
  private restoringLegacyDraft = false;
  private manualTemplateChoice = false;

  constructor() {
    this.restoredFromDraft = this.tryRestoreDraft();
    void this.defaultConsentSvc.ensureBuiltInTemplates().catch(() => undefined);

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

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      if (this.restoredFromDraft) return;
      const treatmentId = params.get('treatment');
      if (treatmentId) {
        this.intendedTreatmentId.set(treatmentId);
      }
    });

    effect(() => {
      if (this.phase() !== 'setup' || this.manualTemplateChoice) return;
      const preferred = this.resolvePreferredTemplateId();
      if (preferred && preferred !== this.selectedTemplateId()) {
        this.selectedTemplateId.set(preferred);
      }
    });

    effect(() => {
      if (this.phase() !== 'setup') return;
      const templateId = this.selectedTemplateId();
      if (!templateId) return;
      if (this.templateVersion()?.templateId === templateId) return;
      void this.preloadSelectedTemplate(templateId);
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
      this.setupError.set(
        this.clientBlockedReason(client) || 'Complete the required client details to continue.',
      );
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

  selectConsentForm(templateId: string): void {
    if (!this.liveFormOptions().some((template) => template.id === templateId)) return;
    this.manualTemplateChoice = true;
    this.selectedTemplateId.set(templateId);
    this.setupError.set('');
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
    if (JSON.stringify(this.answers()[key]) !== JSON.stringify(value)) {
      this.signatureDataUrl.set(null);
      this.therapistReviewed.set(false);
    }
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
    if (index >= 0 && index <= this.stepIndex()) this.moveToStep(index);
  }

  canEditReviewGroup(stepKey: string): boolean {
    return this.steps().some((step) => step.key === stepKey);
  }

  editReviewGroup(stepKey: string): void {
    const index = this.steps().findIndex((step) => step.key === stepKey);
    if (index >= 0) this.moveToStep(index);
  }

  private moveToStep(index: number): void {
    this.validationAttempted.set(false);
    this.stepIndex.set(index);
    requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('.step-heading');
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }

  toggleTherapistReviewed(): void {
    this.therapistReviewed.update((value) => !value);
  }

  requestExit(): void {
    this.exitConfirmOpen.set(true);
  }

  async exitConsentForm(): Promise<void> {
    this.persistDraft();
    this.pwa.setConsultationActive(false);
    await this.router.navigate(['/therapist']);
  }

  isNextExistingClient(): boolean {
    return !!this.selectedClientId();
  }

  async beginConsentForm(): Promise<void> {
    if (this.starting()) return;
    this.setupError.set('');
    if (!this.isReturningClientLocked()) {
      this.markAllSetupTouched();
    }
    if (!this.canBegin()) {
      this.setupError.set(this.setupBlockedReason());
      return;
    }

    this.starting.set(true);
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
          void this.dispatcher
            .notifyAdmins({
              type: 'client_created',
              title: 'New client added',
              body: `${resolved.fullName} was added during a consent form.`,
              link: `/admin/clients/${resolved.id}`,
              entityType: 'client',
              entityId: resolved.id,
            })
            .catch(() => undefined);
        }
      }

      this.selectedClientId.set(resolved.id);
      this.client.set({ ...resolved, active: true } as Client);
      await this.loadSelectedTemplate();

      if (this.resumeDraftAfterTemplateLoad) {
        this.stepIndex.set(Math.min(this.stepIndex(), Math.max(0, this.steps().length - 1)));
        this.resumeDraftAfterTemplateLoad = false;
        this.setPhase('wizard');
        this.pwa.setConsultationActive(true);
        return;
      }

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
      prefill['salon_outlet'] = this.salonIdentity.name();
      prefill['treatment_requested'] = this.intendedTreatment()?.name ?? '';
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
      this.setupError.set(
        'Could not prepare the form. Your details are still here; please try again.',
      );
    } finally {
      this.starting.set(false);
    }
  }

  private async loadSelectedTemplate(): Promise<void> {
    if (this.draftTemplateVersionId) {
      const savedVersion = await firstValueFrom(this.versionsSvc.get(this.draftTemplateVersionId));
      if (!savedVersion) throw new Error('The saved consent form version is unavailable.');
      this.selectedTemplateId.set(savedVersion.templateId);
      this.templateVersion.set(savedVersion);
      return;
    }

    const templateId = this.selectedTemplateId() ?? this.resolvePreferredTemplateId();
    if (!templateId) throw new Error('No live consent form is available.');
    this.selectedTemplateId.set(templateId);

    const template =
      this.consentTemplates().find((item) => item.id === templateId) ??
      (await firstValueFrom(this.templatesSvc.get(templateId)));

    if (template && !isConsentFormLive(template) && !this.restoringLegacyDraft) {
      throw new Error('That consent form is not live. Choose another live form.');
    }
    if (template?.currentPublishedVersionId) {
      const version = await firstValueFrom(
        this.versionsSvc.get(template.currentPublishedVersionId),
      );
      if (!version) throw new Error('The published consent form version is unavailable.');
      this.templateVersion.set(
        !this.restoringLegacyDraft && canUpgradeBuiltInConsentTemplate(template, version)
          ? this.fallbackVersion(templateId)
          : version,
      );
      return;
    }

    this.templateVersion.set(
      this.restoringLegacyDraft
        ? resolveBundledConsentVersion(PREVIOUS_DEFAULT_CONSENT_TEMPLATE.versionId)!
        : this.fallbackVersion(templateId),
    );
  }

  private async preloadSelectedTemplate(templateId: string): Promise<void> {
    try {
      const option = this.liveFormOptions().find((template) => template.id === templateId);
      if (!option?.currentPublishedVersionId) return;
      const version = await firstValueFrom(this.versionsSvc.get(option.currentPublishedVersionId));
      if (version && this.selectedTemplateId() === templateId && this.phase() === 'setup') {
        this.templateVersion.set(version);
      }
    } catch {
      if (this.selectedTemplateId() === templateId && this.phase() === 'setup') {
        const bundled = this.fallbackVersion(templateId);
        if (bundled) this.templateVersion.set(bundled);
      }
    }
  }

  private resolvePreferredTemplateId(): string | null {
    const live = this.liveFormOptions();
    if (!live.length) return null;

    const treatmentTemplateId = this.intendedTreatment()?.consentTemplateId ?? null;
    if (treatmentTemplateId && live.some((template) => template.id === treatmentTemplateId)) {
      return treatmentTemplateId;
    }

    const salonDefaultId = this.salonSettings()?.defaultConsentTemplateId ?? null;
    if (salonDefaultId && live.some((template) => template.id === salonDefaultId)) {
      return salonDefaultId;
    }

    const systemDefault = live.find((template) => template.isSystemDefault);
    if (systemDefault) return systemDefault.id;

    if (live.some((template) => template.id === DEFAULT_CONSENT_TEMPLATE_ID)) {
      return DEFAULT_CONSENT_TEMPLATE_ID;
    }

    return live[0]?.id ?? null;
  }

  private fallbackVersion(templateId: string = DEFAULT_CONSENT_TEMPLATE_ID): ConsentTemplateVersion {
    const builtIn = BUILT_IN_CONSENT_TEMPLATES.find((template) => template.templateId === templateId);
    if (builtIn) {
      return resolveBundledConsentVersion(builtIn.versionId)!;
    }
    return resolveBundledConsentVersion(DEFAULT_CONSENT_VERSION_ID)!;
  }

  next(): void {
    if (!this.canContinue()) {
      this.validationAttempted.set(true);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.step-content [aria-invalid="true"]')?.focus());
      return;
    }
    if (this.stepIndex() < this.steps().length - 1) this.moveToStep(this.stepIndex() + 1);
  }

  back(): void {
    if (this.stepIndex() > 0) {
      this.moveToStep(this.stepIndex() - 1);
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
    if (!resolved || !version || !signature || !this.isConsentFormComplete() || (this.needsInlineTherapistReview() && !this.therapistReviewed()) || this.phase() === 'saving') return;

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
      } as Omit<import('@core/models').Consultation, 'id'>);

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
      } as Omit<import('@core/models').ConsentSubmission, 'id'>);

      await this.consultationsSvc.update(consultationId, {
        consentSubmissionId: submissionId,
      } as Partial<import('@core/models').Consultation>);

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

      void this.dispatcher
        .notifyAdmins({
          type: 'consultation_started',
          title: 'Consent form signed',
          body: `${resolved.fullName} signed a consent form (pending review).`,
          link: '/admin/consultations',
          entityType: 'consultation',
          entityId: consultationId,
        })
        .catch(() => undefined);

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
    if (draft.templateId) {
      this.manualTemplateChoice = true;
      this.selectedTemplateId.set(draft.templateId);
    }

    if (draft.phase === 'wizard' && draft.client) {
      this.draftTemplateVersionId = draft.templateVersionId ?? null;
      this.restoringLegacyDraft = !draft.templateVersionId;
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
      void this.loadSelectedTemplate()
        .then(() => {
          const maxStep = Math.max(0, this.steps().length - 1);
          this.stepIndex.set(Math.min(draft.stepIndex, maxStep));
        })
        .catch(() => {
          this.resumeDraftAfterTemplateLoad = true;
          this.selectedClientId.set(draft.client!.id);
          this.editingClientDetails.set(true);
          this.setPhase('setup');
          this.pwa.setConsultationActive(false);
          this.setupError.set(
            'Could not reopen the saved form. Your answers are safe; please try again.',
          );
        });
      return true;
    }

    this.editingClientDetails.set(
      draft.editingClientDetails ??
        (!draft.selectedClientId &&
          !!(draft.clientFirstName || draft.clientLastName || draft.clientPhone || draft.clientEmail)),
    );
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
      phase: phase === 'wizard' || this.resumeDraftAfterTemplateLoad ? 'wizard' : 'setup',
      editingClientDetails: this.editingClientDetails(),
      templateId: this.selectedTemplateId(),
      templateVersionId: this.templateVersion()?.id ?? this.draftTemplateVersionId,
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
    if (field.type === 'acknowledgement' || field.type === 'checkbox') return value === true;
    if (!this.hasValue(value)) return false;
    if (['yes_no', 'yes_no_unsure'].includes(field.type)) return ['yes', 'no', ...(field.type === 'yes_no_unsure' ? ['unsure'] : [])].includes(String(value));
    if (field.type === 'email' && typeof value === 'string') return isValidEmail(value);
    if (field.type === 'phone' && typeof value === 'string') return isValidPhone(value);
    return true;
  }

  private hasValue(v: unknown): boolean {
    if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }

  private paletteIndex(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
      hash = (hash + name.charCodeAt(i)) % AVATAR_PALETTES.length;
    return hash;
  }
}
