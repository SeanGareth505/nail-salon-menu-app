import { AuditFields, WithId } from './common.model';

export type ConsultationStatus =
  | 'in_progress'
  | 'pending'
  | 'complete'
  | 'abandoned'
  | 'incomplete'
  | 'flagged';

export interface Consultation extends WithId, AuditFields {
  clientId: string;
  clientName: string;
  treatmentId: string | null;
  treatmentIds?: string[];
  treatmentName: string | null;
  treatmentNames?: string[];
  treatmentOther: string | null;
  treatmentOthers?: string[];
  intendedTherapistId: string | null;
  intendedTherapistName: string | null;
  performingTherapistId: string | null;
  performingTherapistName: string | null;
  therapistId: string | null;
  therapistName: string | null;
  consentSubmissionId: string | null;
  consentNotes: string | null;
  status: ConsultationStatus;
  startedAt: string;
  signedAt: string | null;
  completedAt: string | null;
  currentStep: string | null;
}
