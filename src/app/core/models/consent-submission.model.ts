import { AuditFields, WithId } from './common.model';

export interface ConsentAnswer {
  fieldKey: string;
  /** raw captured value — string | string[] | boolean | number depending on field type */
  value: string | string[] | boolean | number | null;
  flagged?: boolean;       // set true when this answer triggered a warning/review rule
  flagReason?: string;
}

export interface ConsentSignature {
  dataUrl: string;         // stored in Firebase Storage; this holds the download URL, not raw base64
  signedAt: string;        // ISO timestamp
  signedByName: string;
}

export type ConsentSubmissionStatus = 'incomplete' | 'flagged' | 'complete';

export interface ConsentSubmission extends WithId, AuditFields {
  consultationId: string;
  clientId: string;
  treatmentId: string;
  therapistId: string;
  templateId: string;
  templateVersionId: string;   // exact immutable version signed against
  templateVersionNumber: number;
  answers: ConsentAnswer[];
  signature: ConsentSignature | null;
  status: ConsentSubmissionStatus;
  requiresTherapistReview: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}
