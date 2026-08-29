import { AuditFields, WithId } from './common.model';

export type ConsultationStatus = 'in_progress' | 'incomplete' | 'flagged' | 'complete' | 'abandoned';

export interface Consultation extends WithId, AuditFields {
  clientId: string;
  clientName: string;          // denormalized
  treatmentId: string;
  treatmentName: string;       // denormalized
  therapistId: string;
  therapistName: string;       // denormalized
  consentSubmissionId: string | null;
  status: ConsultationStatus;
  startedAt: string;
  completedAt: string | null;
  currentStep: string | null;  // for resuming an in-progress wizard
}
