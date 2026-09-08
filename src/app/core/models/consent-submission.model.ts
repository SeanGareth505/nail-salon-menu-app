import { AuditFields, WithId } from './common.model';

export interface ConsentAnswer {
  fieldKey: string;
  value: string | string[] | boolean | number | null;
  flagged?: boolean;
  flagReason?: string;
}

export interface ConsentSignature {
  dataUrl: string;
  signedAt: string;
  signedByName: string;
}

export type ConsentSubmissionStatus = 'pending' | 'complete';

export interface ConsentSubmission extends WithId, AuditFields {
  consultationId: string;
  clientId: string;
  treatmentId: string | null;
  therapistId: string | null;
  templateId: string;
  templateVersionId: string;
  templateVersionNumber: number;
  answers: ConsentAnswer[];
  signature: ConsentSignature | null;
  status: ConsentSubmissionStatus;
  requiresTherapistReview: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}
