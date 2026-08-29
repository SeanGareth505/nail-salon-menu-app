import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import { Storage } from '@angular/fire/storage';

import { ClientsService } from '../../../core/services/clients.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { ConsentTemplatesService } from '../../../core/services/consent-templates.service';
import { ConsentTemplateVersionsService } from '../../../core/services/consent-template-versions.service';
import { ConsentSubmissionsService } from '../../../core/services/consent-submissions.service';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AuditService } from '../../../core/services/audit.service';
import { PwaService } from '../../../core/pwa/pwa.service';
import { isFieldVisible, fieldRequiresReview } from '../../../core/consent/condition-evaluator';
import { Client, ConsentField, ConsentStepDefinition, ConsentTemplateVersion } from '../../../core/models';

import { SfIcon } from '../../../shared/components/icon/icon';
import { SfDynamicField } from '../../../shared/components/dynamic-field/dynamic-field';
import { SfSignaturePad } from '../../../shared/components/signature-pad/signature-pad';
import { SfSuccessAnimation } from '../../../shared/components/success-animation/success-animation';
import { SfLoadingOverlay } from '../../../shared/components/loading-overlay/loading-overlay';
import { expandCollapse, wizardStep } from '../../../shared/animations/motion.animations';

type Phase = 'setup' | 'wizard' | 'saving' | 'complete';

@Component({
  selector: 'app-consultation-wizard',
  standalone: true,
  imports: [FormsModule, RouterLink, SfIcon, SfDynamicField, SfSignaturePad, SfSuccessAnimation, SfLoadingOverlay],
  templateUrl: './consultation-wizard.html',
  styleUrl: './consultation-wizard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [wizardStep, expandCollapse],
})
export class ConsultationWizard implements OnDestroy {
  private readonly clientsSvc = inject(ClientsService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly templatesSvc = inject(ConsentTemplatesService);
  private readonly versionsSvc = inject(ConsentTemplateVersionsService);
  private readonly submissionsSvc = inject(ConsentSubmissionsService);
  private readonly consultationsSvc = inject(ConsultationsService);
  readonly auth = inject(AuthService);
  private readonly audit = inject(AuditService);
  private readonly storage = inject(Storage);
  private readonly router = inject(Router);
  private readonly pwa = inject(PwaService);

  readonly phase = signal<Phase>('setup');

  // ---- setup step ----
  readonly clients = toSignal(this.clientsSvc.listAll(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });
  readonly clientSearch = signal('');
  readonly selectedClientId = signal<string | 'new' | null>(null);
  readonly newClientName = signal('');
  readonly newClientPhone = signal('');
  readonly newClientEmail = signal('');
  readonly selectedTreatmentId = signal<string | null>(null);
  readonly setupError = signal('');

  readonly filteredClients = computed(() => {
    const term = this.clientSearch().trim().toLowerCase();
    if (!term) return this.clients().slice(0, 8);
    return this.clients().filter((c) => c.fullName.toLowerCase().includes(term) || c.phone.includes(term)).slice(0, 8);
  });

  readonly selectedTreatment = computed(() => this.treatments().find((t) => t.id === this.selectedTreatmentId()) ?? null);

  // ---- active wizard state ----
  readonly client = signal<Client | null>(null);
  readonly clientId = signal<string | null>(null);
  readonly templateVersion = signal<ConsentTemplateVersion | null>(null);
  readonly answers = signal<Record<string, unknown>>({});
  readonly signatureDataUrl = signal<string | null>(null);
  readonly stepIndex = signal(0);
  readonly saveError = signal('');

  readonly steps = computed<ConsentStepDefinition[]>(() => {
    const v = this.templateVersion();
    const base = v ? [...v.steps].sort((a, b) => a.sortOrder - b.sortOrder) : [];
    return [...base, { key: 'review', title: 'Review', sortOrder: 999 }, { key: 'signature', title: 'Signature', sortOrder: 1000 }];
  });

  readonly currentStep = computed(() => this.steps()[this.stepIndex()] ?? null);

  readonly currentFields = computed<ConsentField[]>(() => {
    const v = this.templateVersion();
    const step = this.currentStep();
    if (!v || !step || step.key === 'review' || step.key === 'signature') return [];
    return v.fields
      .filter((f) => f.step === step.key)
      .filter((f) => isFieldVisible(f, this.answers()))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  });

  readonly allDataFields = computed<ConsentField[]>(() => {
    const v = this.templateVersion();
    if (!v) return [];
    return v.fields.filter((f) => !['information', 'warning'].includes(f.type));
  });

  readonly flaggedFields = computed<ConsentField[]>(() => {
    const v = this.templateVersion();
    if (!v) return [];
    return v.fields.filter((f) => fieldRequiresReview(f, this.answers()));
  });

  readonly canContinue = computed(() => {
    const step = this.currentStep();
    if (!step) return false;
    if (step.key === 'review') return true;
    if (step.key === 'signature') return !!this.signatureDataUrl();
    return this.currentFields()
      .filter((f) => f.required && !['information', 'warning'].includes(f.type))
      .every((f) => this.hasValue(this.answers()[f.key]));
  });

  private hasValue(v: unknown): boolean {
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }

  fieldValue(key: string): unknown {
    return this.answers()[key] ?? null;
  }

  setFieldValue(key: string, value: unknown): void {
    this.answers.update((a) => ({ ...a, [key]: value }));
  }

  stepLabel(step: ConsentStepDefinition): string {
    return step.title;
  }

  goToStep(index: number): void {
    if (index <= this.stepIndex()) this.stepIndex.set(index);
  }

  constructor() {
    this.pwa.setConsultationActive(true);
  }

  ngOnDestroy(): void {
    this.pwa.setConsultationActive(false);
  }

  // ---- setup -> begin wizard ----
  async beginConsultation(): Promise<void> {
    this.setupError.set('');
    if (!this.selectedTreatmentId()) {
      this.setupError.set('Choose a treatment to continue.');
      return;
    }
    const treatment = this.selectedTreatment();
    if (!treatment) return;

    let client: Client | null = null;

    if (this.selectedClientId() === 'new') {
      if (!this.newClientName().trim()) {
        this.setupError.set('Enter the client’s name.');
        return;
      }
      const id = await this.clientsSvc.create({
        fullName: this.newClientName().trim(),
        phone: this.newClientPhone().trim(),
        email: this.newClientEmail().trim(),
        dateOfBirth: null,
        notes: '',
        lastKnownAnswers: {},
        lastKnownAnswersUpdatedAt: null,
        lastConsultationAt: null,
        totalConsultations: 0,
        active: true,
      } as any);
      client = { id, fullName: this.newClientName().trim(), phone: this.newClientPhone().trim(), email: this.newClientEmail().trim() } as Client;
    } else if (this.selectedClientId()) {
      client = this.clients().find((c) => c.id === this.selectedClientId()) ?? null;
    }

    if (!client) {
      this.setupError.set('Choose an existing client or add a new one.');
      return;
    }

    this.client.set(client);
    this.clientId.set(client.id);

    // Load the treatment's consent template + its currently published (immutable) version.
    if (treatment.consentTemplateId) {
      const template = await new Promise<any>((resolve) => {
        const sub = this.templatesSvc.get(treatment.consentTemplateId!).subscribe((t) => {
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
      } else {
        this.templateVersion.set(this.fallbackVersion());
      }
    } else {
      this.templateVersion.set(this.fallbackVersion());
    }

    // Prefill from the client's last known answers — fully editable, confirmed each session.
    const prefill: Record<string, unknown> = {};
    const lastKnown = (client as any).lastKnownAnswers ?? {};
    for (const field of this.allDataFields()) {
      if (lastKnown[field.key] !== undefined) prefill[field.key] = lastKnown[field.key];
    }
    if (!prefill['full_name'] && client.fullName) prefill['full_name'] = client.fullName;
    if (!prefill['phone'] && client.phone) prefill['phone'] = client.phone;
    if (!prefill['email'] && client.email) prefill['email'] = client.email;
    this.answers.set(prefill);

    this.stepIndex.set(0);
    this.phase.set('wizard');
    this.pwa.setConsultationActive(true);
  }

  /** Used when a treatment has no consent template configured yet, so the wizard still functions. */
  private fallbackVersion(): ConsentTemplateVersion {
    return {
      id: 'fallback',
      templateId: 'fallback',
      versionNumber: 1,
      status: 'published',
      publishedAt: null,
      publishedBy: null,
      steps: [
        { key: 'details', title: 'Your details', sortOrder: 1 },
        { key: 'health_safety', title: 'Health & safety', sortOrder: 2 },
      ],
      fields: [
        { key: 'full_name', type: 'text', label: 'Full name', required: true, step: 'details', sortOrder: 1 },
        { key: 'phone', type: 'phone', label: 'Phone number', required: true, step: 'details', sortOrder: 2 },
        { key: 'allergies', type: 'yes_no_unsure', label: 'Do you have any known allergies?', required: true, step: 'health_safety', sortOrder: 1 },
      ],
    } as any;
  }

  isNextExistingClient(): boolean {
    return this.selectedClientId() !== null && this.selectedClientId() !== 'new';
  }

  next(): void {
    if (this.stepIndex() < this.steps().length - 1) this.stepIndex.update((i) => i + 1);
  }

  back(): void {
    if (this.stepIndex() > 0) this.stepIndex.update((i) => i - 1);
  }

  onSignature(dataUrl: string | null): void {
    this.signatureDataUrl.set(dataUrl);
  }

  async submit(): Promise<void> {
    const client = this.client();
    const treatment = this.selectedTreatment();
    const version = this.templateVersion();
    const signature = this.signatureDataUrl();
    if (!client || !treatment || !version || !signature) return;

    this.phase.set('saving');
    this.saveError.set('');

    try {
      const uid = this.auth.currentUid() ?? 'unknown';
      const therapistId = this.auth.therapistId() ?? uid;
      const displayName = this.auth.displayName() || 'Therapist';

      const consultationId = await this.consultationsSvc.create({
        clientId: client.id,
        clientName: client.fullName,
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        therapistId,
        therapistName: displayName,
        consentSubmissionId: null,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        completedAt: null,
        currentStep: null,
      } as any);

      // Upload signature PNG to Storage rather than storing the base64 blob in Firestore.
      const storageRef = ref(this.storage, `signatures/${consultationId}.png`);
      await uploadString(storageRef, signature, 'data_url');
      const signatureUrl = await getDownloadURL(storageRef);

      const answerList = this.allDataFields().map((f) => {
        const value = this.answers()[f.key] ?? null;
        const flagged = this.flaggedFields().some((w) => (w.conditions ?? []).some((c) => c.dependsOn === f.key));
        return {
          fieldKey: f.key,
          value: value as any,
          flagged,
          flagReason: flagged ? this.flaggedFields().find((w) => (w.conditions ?? []).some((c) => c.dependsOn === f.key))?.bodyText : undefined,
        };
      });

      const requiresReview = this.flaggedFields().length > 0;
      const status = requiresReview ? 'flagged' : 'complete';

      const submissionId = await this.submissionsSvc.create({
        consultationId,
        clientId: client.id,
        treatmentId: treatment.id,
        therapistId,
        templateId: version.templateId,
        templateVersionId: version.id,
        templateVersionNumber: version.versionNumber,
        answers: answerList,
        signature: { dataUrl: signatureUrl, signedAt: new Date().toISOString(), signedByName: client.fullName },
        status,
        requiresTherapistReview: requiresReview,
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
      } as any);

      await this.consultationsSvc.update(consultationId, {
        consentSubmissionId: submissionId,
        status,
        completedAt: new Date().toISOString(),
      } as any);

      const snapshot: Record<string, unknown> = {};
      for (const f of this.allDataFields()) {
        if (this.answers()[f.key] !== undefined) snapshot[f.key] = this.answers()[f.key];
      }
      await this.clientsSvc.updateLastKnownAnswers(client.id, snapshot);
      await this.clientsSvc.update(client.id, {
        lastConsultationAt: new Date().toISOString(),
        totalConsultations: ((client as any).totalConsultations ?? 0) + 1,
      } as any);

      await this.audit.log('sign', 'consentSubmission', submissionId, `${displayName} captured consent for ${client.fullName} (${treatment.name})`);

      this.phase.set('complete');
      this.pwa.setConsultationActive(false);
    } catch (err) {
      this.saveError.set('Something went wrong saving this consultation. Please try again.');
      this.phase.set('wizard');
    }
  }

  goToClient(): void {
    const id = this.client()?.id;
    if (id) this.router.navigate(['/therapist/clients', id]);
    else this.router.navigate(['/therapist']);
  }
}
