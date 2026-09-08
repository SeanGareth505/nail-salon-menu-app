import { inject, Injectable } from '@angular/core';
import { limit, orderBy, where } from '@angular/fire/firestore';
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

    await this.update(consultationId, {
      status: 'complete',
      treatmentId,
      treatmentIds: resolvedIds,
      treatmentName,
      treatmentNames,
      treatmentOther: treatmentOthers.length ? treatmentOthers.join(', ') : null,
      treatmentOthers: treatmentOthers.length ? treatmentOthers : undefined,
      performingTherapistId,
      performingTherapistName,
      therapistId: performingTherapistId,
      therapistName: performingTherapistName,
      completedAt,
    } as Partial<Consultation>);

    if (consultation.consentSubmissionId) {
      await this.submissionsSvc.update(consultation.consentSubmissionId, {
        status: 'complete',
        treatmentId,
        therapistId: performingTherapistId,
      } as Partial<ConsentSubmission>);
    }
  }
}
