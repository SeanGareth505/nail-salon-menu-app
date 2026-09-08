import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SfConsentFormCompletePanel } from './consent-form-complete-panel';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { ConsentSubmissionsService } from '../../../core/services/consent-submissions.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { TreatmentsService } from '../../../core/services/treatments.service';

describe('Therapist consent signoff', () => {
  let fixture: ComponentFixture<SfConsentFormCompletePanel>;
  let component: SfConsentFormCompletePanel;
  let complete: jasmine.Spy;
  let version: string;

  beforeEach(async () => {
    version = 'general-health-safety-v2';
    complete = jasmine.createSpy('completeConsentForm').and.resolveTo(undefined);
    TestBed.configureTestingModule({
      imports: [SfConsentFormCompletePanel],
      providers: [
        { provide: ConsultationsService, useValue: { get: () => of({ consentSubmissionId: 'signed' }), completeConsentForm: complete } },
        { provide: ConsentSubmissionsService, useValue: { get: () => of({ templateId: 'general-health-safety', templateVersionId: version, templateVersionNumber: version.endsWith('v2') ? 2 : 1 }) } },
        { provide: TherapistsService, useValue: { listActive: () => of([{ id: 'staff-1', name: 'Alex' }, { id: 'staff-2', name: 'Sam' }]) } },
        { provide: TreatmentsService, useValue: { listActive: () => of([{ id: 'treatment', name: 'Manicure' }]) } },
      ],
    }).overrideComponent(SfConsentFormCompletePanel, { set: { template: '' } });
    fixture = TestBed.createComponent(SfConsentFormCompletePanel);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('consultationId', 'consultation');
    component.performingTherapistId.set('staff-1');
    component.selectedTreatmentIds.set(['treatment']);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('requires an explicit declaration and signature for the new default', async () => {
    expect(component.signoffRequired()).toBeTrue();
    await component.submit();
    expect(complete).not.toHaveBeenCalled();
    component.reviewConfirmed.set(true);
    expect(component.canSubmit()).toBeFalse();
    component.therapistSignature.set('data:image/png;base64,c2lnbmVk');
    await component.submit();
    expect(complete).toHaveBeenCalledWith('consultation', jasmine.objectContaining({
      performingTherapistId: 'staff-1', therapistReviewConfirmed: true,
      therapistSignatureDataUrl: 'data:image/png;base64,c2lnbmVk',
    }));
  });

  it('clears approval when the selected therapist changes', () => {
    component.reviewConfirmed.set(true);
    component.therapistSignature.set('data:image/png;base64,c2lnbmVk');
    component.performingTherapistId.set('staff-2');
    fixture.detectChanges();
    expect(component.reviewConfirmed()).toBeFalse();
    expect(component.therapistSignature()).toBeNull();
    expect(component.canSubmit()).toBeFalse();
  });

  it('clears approval when recorded treatments change', () => {
    component.reviewConfirmed.set(true);
    component.therapistSignature.set('data:image/png;base64,c2lnbmVk');
    component.otherTreatments.set(['Nail repair']);
    fixture.detectChanges();
    expect(component.reviewConfirmed()).toBeFalse();
    expect(component.therapistSignature()).toBeNull();
  });

  it('does not retroactively demand signatures for historical forms', async () => {
    version = 'general-health-safety-v1';
    fixture.componentRef.setInput('consultationId', 'historical-consultation');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.signoffRequired()).toBeFalse();
    expect(component.canSubmit()).toBeTrue();
    await component.submit();
    expect(complete).toHaveBeenCalledWith('historical-consultation', {
      performingTherapistId: 'staff-1', treatmentIds: ['treatment'], treatmentOthers: [],
    });
  });

  it('prevents duplicate submissions while completion is being recorded', async () => {
    let finish!: () => void;
    complete.and.returnValue(new Promise<void>((resolve) => { finish = resolve; }));
    component.reviewConfirmed.set(true);
    component.therapistSignature.set('data:image/png;base64,c2lnbmVk');
    const first = component.submit();
    await component.submit();
    expect(complete).toHaveBeenCalledTimes(1);
    finish();
    await first;
  });
});
