import { inject, Injectable } from '@angular/core';
import { doc, limit, orderBy, serverTimestamp, where, writeBatch } from '@angular/fire/firestore';
import { isNailConsentSubmission, requiresTherapistSignoff, THERAPIST_REVIEW_DECLARATION } from '../consent/therapist-signoff';
import { firstValueFrom } from 'rxjs';
import { Client, ConsentSubmission, Consultation } from '../models';
import { CompleteConsentFormInputDto } from '../models/complete-consent-form.model';
import { clientFullName } from '../utils/client-name.util';
import { FirestoreBaseRepository } from './firestore-base.repository';
import { ConsentSubmissionsService } from './consent-submissions.service';
import { TherapistsService } from './therapists.service';
import { TreatmentsService } from './treatments.service';

export interface UpsertClientInputDto {
  id?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class ConsultationsService extends FirestoreBaseRepository<Consultation> {
  protected readonly path = 'consultations';

  private readonly submissionsSvc = inject(ConsentSubmissionsService);
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly treatmentsSvc = inject(TreatmentsService);

  listRecent(max = 20) {
    return this.list(orderBy('startedAt', 'desc'), limit(max));
  }

  listPending(max = 50) {
    return this.list(where('status', '==', 'pending'), orderBy('signedAt', 'desc'), limit(max));
  }

  listHistory(max = 50) {
    return this.list(where('status', '==', 'complete'), orderBy('completedAt', 'desc'), limit(max));
  }

  listForTherapist(therapistId: string, max = 50) {
    return this.list(where('therapistId', '==', therapistId), orderBy('startedAt', 'desc'), limit(max));
  }

  listForClient(clientId: string) {
    return this.list(where('clientId', '==', clientId), orderBy('startedAt', 'desc'));
  }

  async completeConsentForm(consultationId: string, input: CompleteConsentFormInputDto): Promise<void> {
    const consultation = await firstValueFrom(this.get(consultationId));
    if (!consultation || consultation.status !== 'pending') {
      throw new Error('not-pending');
    }

    const submission = consultation.consentSubmissionId
      ? await firstValueFrom(this.submissionsSvc.get(consultation.consentSubmissionId))
      : undefined;
    if (consultation.consentSubmissionId && !submission) throw new Error('submission-not-found');
    const signoffRequired = requiresTherapistSignoff(submission);
    const uid = this.auth.currentUid();
    if (signoffRequired && (!uid || input.therapistReviewConfirmed !== true ||
      !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(input.therapistSignatureDataUrl ?? ''))) {
      throw new Error('therapist-signoff-required');
    }

    if (isNailConsentSubmission(submission)) {
      const assessment = input.nailAssessment;
      const conditions = ['poor', 'good', 'excellent'];
      if (!assessment || !conditions.includes(assessment.nailCondition) ||
        !conditions.includes(assessment.cuticleCondition) || typeof assessment.hygieneBag !== 'boolean' ||
        (assessment.pedicure && typeof assessment.pedicure.dryOrCrackedHeels !== 'boolean')) {
        throw new Error('nail-assessment-required');
      }
    }

    const therapists = await firstValueFrom(this.therapistsSvc.listActive());
    const therapist = therapists.find((t) => t.id === input.performingTherapistId);
    if (!therapist) {
      throw new Error('invalid-therapist');
    }

    const catalogIds = [...new Set(input.treatmentIds)];
    const treatmentOthers = [...new Set((input.treatmentOthers ?? []).map((name) => name.trim()).filter(Boolean))];

    if (!catalogIds.length && !treatmentOthers.length) {
      throw new Error('treatment-required');
    }

    const treatments = await firstValueFrom(this.treatmentsSvc.listActive());
    const treatmentNames: string[] = [];
    const resolvedIds: string[] = [];

    for (const id of catalogIds) {
      const treatment = treatments.find((t) => t.id === id);
      if (!treatment) {
        throw new Error('invalid-treatment');
      }
      resolvedIds.push(treatment.id);
      treatmentNames.push(treatment.name);
    }

    treatmentNames.push(...treatmentOthers);

    const treatmentId = resolvedIds[0] ?? null;
    const treatmentName = treatmentNames.length ? treatmentNames.join(', ') : null;
    const performingTherapistId = therapist.id;
    const performingTherapistName = therapist.name;
    const completedAt = new Date().toISOString();

    const consultationUpdate: Partial<Consultation> = {
      status: 'complete',
      treatmentId,
      treatmentIds: resolvedIds,
      treatmentName,
      treatmentNames,
      treatmentOther: treatmentOthers.length ? treatmentOthers.join(', ') : null,
      treatmentOthers,
      performingTherapistId,
      performingTherapistName,
      therapistId: performingTherapistId,
      therapistName: performingTherapistName,
      completedAt,
    };

    const submissionUpdate: Partial<ConsentSubmission> = {
        status: 'complete',
        treatmentId,
        therapistId: performingTherapistId,
    };
    if (isNailConsentSubmission(submission)) {
      submissionUpdate.nailAssessment = input.nailAssessment!;
    }
    if (signoffRequired) {
      submissionUpdate.therapistSignature = {
        dataUrl: input.therapistSignatureDataUrl!,
        signedAt: completedAt,
        signedByName: performingTherapistName,
        therapistId: performingTherapistId,
        recordedByUid: uid!,
        declaration: THERAPIST_REVIEW_DECLARATION,
      };
      submissionUpdate.reviewNotes = input.therapistReviewNotes?.trim() || null;
      submissionUpdate.reviewedBy = uid;
      submissionUpdate.reviewedAt = completedAt;
      submissionUpdate.requiresTherapistReview = false;
    }
    await this.loading.run(async () => {
      const batch = writeBatch(this.firestore);
      const audit = { updatedAt: serverTimestamp(), updatedBy: uid };
      batch.update(this.docRef(consultationId), { ...consultationUpdate, ...audit });
      if (consultation.consentSubmissionId) {
        batch.update(doc(this.firestore, 'consentSubmissions', consultation.consentSubmissionId), {
          ...submissionUpdate, ...audit,
        });
      }
      await batch.commit();
    }, 'Recording treatment completion…');
  }
}
