import { NailAssessment } from './consent-submission.model';

export interface CompleteConsentFormInputDto {
  performingTherapistId: string;
  treatmentIds: string[];
  treatmentOthers?: string[];
  nailAssessment?: NailAssessment;
  therapistReviewNotes?: string;
  therapistReviewConfirmed?: boolean;
  therapistSignatureDataUrl?: string;
}
