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

export interface TherapistConsentSignature extends ConsentSignature {
  therapistId: string;
  recordedByUid: string;
  declaration: string;
}

export type NailCondition = 'poor' | 'good' | 'excellent';
export type NailDigit = 'little' | 'ring' | 'middle' | 'index' | 'thumb';
export type ToeDigit = 'little' | 'fourth' | 'middle' | 'second' | 'big';

export interface NailAssessment {
  nailCondition: NailCondition;
  cuticleCondition: NailCondition;
  hygieneBag: boolean;
  leftHand: Partial<Record<NailDigit, string>>;
  rightHand: Partial<Record<NailDigit, string>>;
  pedicure: {
    dryOrCrackedHeels: boolean;
    mainConcern: string;
    leftFoot: Partial<Record<ToeDigit, string>>;
    rightFoot: Partial<Record<ToeDigit, string>>;
  } | null;
  technicianComments: string;
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
  therapistSignature?: TherapistConsentSignature;
  nailAssessment?: NailAssessment;
  status: ConsentSubmissionStatus;
  requiresTherapistReview: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}
