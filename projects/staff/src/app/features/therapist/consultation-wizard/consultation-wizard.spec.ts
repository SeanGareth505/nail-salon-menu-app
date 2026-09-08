import { ConsentField } from '@core/models';
import { SalonIdentityService } from '@core/services/salon-identity.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Storage } from '@angular/fire/storage';
import { of, throwError } from 'rxjs';
import { ConsultationWizard } from './consultation-wizard';
import { ClientsService } from '@core/services/clients.service';
import { ConsentTemplatesService } from '@core/services/consent-templates.service';
import { ConsentTemplateVersionsService } from '@core/services/consent-template-versions.service';
import { ConsentSubmissionsService } from '@core/services/consent-submissions.service';
import { ConsultationsService } from '@core/services/consultations.service';
import { TherapistsService } from '@core/services/therapists.service';
import { TreatmentsService } from '@core/services/treatments.service';
import { SalonSettingsService } from '@core/services/salon-settings.service';
import { DefaultConsentTemplateService } from '@core/services/default-consent-template.service';
import { AuthService } from '@core/auth/auth.service';
import { AuditService } from '@core/services/audit.service';
import { NotificationDispatcherService } from '@core/services/notification-dispatcher.service';
import { PwaService } from '@core/pwa/pwa.service';
import { TherapistConsultationUiService } from '@core/services/therapist-consultation-ui.service';
import {
  DEFAULT_CONSENT_TEMPLATE_ID,
  DEFAULT_CONSENT_VERSION_ID,
  resolveBundledConsentVersion,
} from '@core/consent/default-consent-template';
import {
  clearConsentFormDraft,
  loadConsentFormDraft,
} from '@core/utils/consent-form-draft.storage';

describe('Consent setup and drafts', () => {
  let fixture: ComponentFixture<ConsultationWizard>;
  let wizard: ConsultationWizard;
  let navigate: jasmine.Spy;

  beforeEach(() => {
    clearConsentFormDraft();
    navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    TestBed.configureTestingModule({
      imports: [ConsultationWizard],
      providers: [
        { provide: SalonIdentityService, useValue: { name: () => 'Sample Salon' } },
        {
          provide: ClientsService,
          useValue: {
            listAll: () => of([]),
            upsertClient: jasmine
              .createSpy('upsertClient')
              .and.resolveTo({
                id: 'sample-client',
                firstName: 'Alex',
                lastName: 'Morgan',
                fullName: 'Alex Morgan',
                phone: '0823334444',
                email: 'alex@example.com',
              }),
          },
        },
        { provide: TherapistsService, useValue: { listActive: () => of([]) } },
        { provide: TreatmentsService, useValue: { listActive: () => of([]) } },
        { provide: SalonSettingsService, useValue: { get: () => of(undefined) } },
        {
          provide: DefaultConsentTemplateService,
          useValue: {
            ensureDefaultTemplate: jasmine.createSpy('ensureDefaultTemplate').and.resolveTo(DEFAULT_CONSENT_TEMPLATE_ID),
            ensureBuiltInTemplates: jasmine.createSpy('ensureBuiltInTemplates').and.resolveTo([DEFAULT_CONSENT_TEMPLATE_ID]),
          },
        },
        { provide: ConsentSubmissionsService, useValue: { listForClient: () => of([]) } },
        {
          provide: ConsentTemplatesService,
          useValue: {
            listAll: () => of([]),
            get: jasmine.createSpy('get').and.returnValue(of(undefined)),
          },
        },
        {
          provide: ConsentTemplateVersionsService,
          useValue: {
            get: jasmine.createSpy('get').and.callFake((id: string) => of(resolveBundledConsentVersion(id))),
          },
        },
        { provide: ConsultationsService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: AuditService, useValue: {} },
        {
          provide: NotificationDispatcherService,
          useValue: { notifyAdmins: jasmine.createSpy('notifyAdmins').and.resolveTo(undefined) },
        },
        { provide: Storage, useValue: {} },
        { provide: PwaService, useValue: { setConsultationActive: () => undefined } },
        { provide: TherapistConsultationUiService, useValue: { setHideChrome: () => undefined } },
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } },
      ],
    }).overrideComponent(ConsultationWizard, { set: { template: '', imports: [] } });
    fixture = TestBed.createComponent(ConsultationWizard);
    wizard = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => clearConsentFormDraft());

  function enterClient(): void {
    wizard.beginNewClientForm();
    wizard.clientFirstName.set('Alex');
    wizard.clientLastName.set('Morgan');
    wizard.clientPhone.set('0823334444');
    wizard.clientEmail.set('alex@example.com');
  }

  it('does not start a form using hidden details after returning to client search', () => {
    enterClient();
    expect(wizard.canBegin()).toBeTrue();
    wizard.onClientSearchChange('another client');
    expect(wizard.editingClientDetails()).toBeFalse();
    expect(wizard.canBegin()).toBeFalse();
    expect(wizard.setupBlockedReason()).toContain('Choose a client');
  });

  it('saves setup details on exit and restores an editable draft', async () => {
    enterClient();
    await wizard.exitConsentForm();
    expect(navigate).toHaveBeenCalledWith(['/therapist']);
    expect(loadConsentFormDraft()?.clientFirstName).toBe('Alex');
    fixture.destroy();
    const restored = TestBed.createComponent(ConsultationWizard);
    restored.detectChanges();
    expect(restored.componentInstance.clientFirstName()).toBe('Alex');
    expect(restored.componentInstance.editingClientDetails()).toBeTrue();
    expect(restored.componentInstance.canBegin()).toBeTrue();
  });

  it('prevents duplicate client saves while preparing a form', async () => {
    enterClient();
    await Promise.all([wizard.beginConsentForm(), wizard.beginConsentForm()]);
    expect(TestBed.inject(ClientsService).upsertClient).toHaveBeenCalledTimes(1);
    expect(wizard.phase()).toBe('wizard');
    expect(wizard.starting()).toBeFalse();
  });


  it('retries template preparation using the client already saved', async () => {
    enterClient();
    const templates = TestBed.inject(ConsentTemplatesService).get as jasmine.Spy;
    templates.and.returnValue(throwError(() => new Error('Offline')));
    await wizard.beginConsentForm();
    expect(wizard.phase()).toBe('setup');
    expect(wizard.selectedClientId()).toBe('sample-client');
    expect(wizard.setupError()).toContain('please try again');
    templates.and.returnValue(of(undefined));
    await wizard.beginConsentForm();
    expect(TestBed.inject(ClientsService).upsertClient).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: 'sample-client' }),
    );
    expect(wizard.phase()).toBe('wizard');
  });

  it('keeps saved answers and signature when reopening a draft fails and is retried', async () => {
    enterClient();
    await wizard.beginConsentForm();
    wizard.answers.set({ skin_sensitivity: 'yes', additional_notes: 'Keep these answers' });
    wizard.signatureDataUrl.set('data:image/png;base64,saved-signature');
    await wizard.exitConsentForm();
    fixture.destroy();
    const versions = TestBed.inject(ConsentTemplateVersionsService).get as jasmine.Spy;
    versions.and.returnValue(throwError(() => new Error('Offline')));
    const restored = TestBed.createComponent(ConsultationWizard);
    await restored.whenStable();
    const recovered = restored.componentInstance;
    expect(recovered.phase()).toBe('setup');
    expect(recovered.setupError()).toContain('Your answers are safe');
    expect(recovered.selectedClientId()).toBe('sample-client');
    expect(loadConsentFormDraft()?.phase).toBe('wizard');
    versions.and.callFake((id: string) => of(resolveBundledConsentVersion(id)));
    await recovered.beginConsentForm();
    expect(recovered.phase()).toBe('wizard');
    expect(recovered.answers()).toEqual({
      skin_sensitivity: 'yes',
      additional_notes: 'Keep these answers',
    });
    expect(recovered.signatureDataUrl()).toBe('data:image/png;base64,saved-signature');
    restored.destroy();
  });

  it('restores unsaved edits to an existing client in edit mode', async () => {
    enterClient();
    wizard.selectedClientId.set('existing-client');
    wizard.clientEmail.set('updated@example.com');
    await wizard.exitConsentForm();
    fixture.destroy();
    const restored = TestBed.createComponent(ConsultationWizard);
    restored.detectChanges();
    expect(restored.componentInstance.selectedClientId()).toBe('existing-client');
    expect(restored.componentInstance.editingClientDetails()).toBeTrue();
    expect(restored.componentInstance.clientEmail()).toBe('updated@example.com');
    expect(restored.componentInstance.isReturningClientLocked()).toBeFalse();
    restored.destroy();
  });

  it('prevents skipping ahead in the consent wizard', () => {
    wizard.stepIndex.set(0);
    wizard.goToStep(1);
    expect(wizard.stepIndex()).toBe(0);
  });
  async function prepareSections(): Promise<void> {
    enterClient();
    await wizard.beginConsentForm();
    const fields: ConsentField[] = [
      { key: 'health', type: 'yes_no_unsure', label: 'Health question', required: true, step: 'health_section', sortOrder: 1 },
      { key: 'health_details', type: 'textarea', label: 'Details', required: true, step: 'health_section', sortOrder: 2, conditions: [{ dependsOn: 'health', operator: 'equals', value: 'yes' }] },
      { key: 'agree', type: 'acknowledgement', label: 'I agree', required: true, step: 'consent_section', sortOrder: 3 },
    ];
    wizard.templateVersion.update((version) => ({
      ...version!,
      steps: [
        { key: 'health_section', title: 'Health', sortOrder: 1 },
        { key: 'consent_section', title: 'Consent', sortOrder: 2 },
      ],
      fields,
    }));
  }

  it('progresses through short sections while retaining earlier answers', async () => {
    await prepareSections();
    expect(wizard.steps().map((step) => step.key)).toEqual(['health_section', 'consent_section', 'signature', 'review']);
    wizard.next();
    expect(wizard.stepIndex()).toBe(0);
    expect(wizard.validationAttempted()).toBeTrue();
    wizard.setFieldValue('health', 'no');
    wizard.next();
    expect(wizard.currentStep()?.key).toBe('consent_section');
    wizard.back();
    expect(wizard.fieldValue('health')).toBe('no');
    expect(wizard.currentStep()?.key).toBe('health_section');
  });

  it('requires explicit acknowledgement and validates conditional text', async () => {
    await prepareSections();
    wizard.setFieldValue('health', 'yes');
    wizard.setFieldValue('health_details', '   ');
    expect(wizard.canContinue()).toBeFalse();
    wizard.setFieldValue('health', 'unsure');
    expect(wizard.canContinue()).toBeTrue();
    wizard.next();
    wizard.setFieldValue('agree', false);
    expect(wizard.canContinue()).toBeFalse();
    wizard.next();
    expect(wizard.currentStep()?.key).toBe('consent_section');
    wizard.setFieldValue('agree', true);
    wizard.next();
    expect(wizard.currentStep()?.key).toBe('signature');
  });

  it('edits the selected review section and invalidates a changed signed answer', async () => {
    await prepareSections();
    wizard.setFieldValue('health', 'no');
    wizard.setFieldValue('agree', true);
    wizard.signatureDataUrl.set('data:image/png;base64,signature');
    wizard.therapistReviewed.set(true);
    wizard.stepIndex.set(3);
    expect(wizard.canContinue()).toBeTrue();
    wizard.editReviewGroup('health_section');
    expect(wizard.currentStep()?.key).toBe('health_section');
    wizard.setFieldValue('health', 'no');
    expect(wizard.signatureDataUrl()).not.toBeNull();
    wizard.setFieldValue('health', 'unsure');
    expect(wizard.signatureDataUrl()).toBeNull();
    expect(wizard.therapistReviewed()).toBeFalse();
    expect(wizard.fieldValue('agree')).toBeTrue();
  });

  it('rechecks the complete form even if a restored draft points at review', async () => {
    await prepareSections();
    wizard.setFieldValue('health', 'no');
    wizard.setFieldValue('agree', false);
    wizard.signatureDataUrl.set('data:image/png;base64,signature');
    wizard.stepIndex.set(3);
    expect(wizard.canContinue()).toBeFalse();
    wizard.openSubmitConfirm();
    expect(wizard.submitConfirmOpen()).toBeFalse();
    await wizard.submit();
    expect(wizard.phase()).toBe('wizard');
  });

  it('keeps clinical flags for staff signoff without asking the client to approve them', async () => {
    await prepareSections();
    wizard.templateVersion.update((version) => ({
      ...version!,
      fields: [...version!.fields,
        { key: 'health_warning', type: 'warning', label: 'Discuss with your therapist', required: false, step: 'health_section', sortOrder: 4, conditions: [{ dependsOn: 'health', operator: 'one_of', value: ['yes', 'unsure'] }] },
        { key: 'legal_warning', type: 'warning', label: 'General disclaimer', required: false, step: 'consent_section', sortOrder: 5 },
      ],
    }));
    wizard.setFieldValue('health', 'no');
    expect(wizard.flaggedReviewCount()).toBe(0);
    wizard.setFieldValue('health', 'unsure');
    wizard.setFieldValue('agree', true);
    wizard.signatureDataUrl.set('data:image/png;base64,signature');
    wizard.stepIndex.set(3);
    expect(wizard.flaggedReviewCount()).toBe(1);
    expect(wizard.usesStaffSignoff()).toBeTrue();
    expect(wizard.steps().some((step) => step.key === 'therapist_review')).toBeFalse();
    wizard.openSubmitConfirm();
    expect(wizard.submitConfirmOpen()).toBeTrue();
    wizard.templateVersion.update((version) => ({ ...version!, id: 'custom-v2' }));
    expect(wizard.usesStaffSignoff()).toBeFalse();
    expect(wizard.steps().some((step) => step.key === 'therapist_review')).toBeTrue();
  });

});
