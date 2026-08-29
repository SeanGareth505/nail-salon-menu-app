import { AuditFields, WithId } from './common.model';
import { ConsentAnswer } from './consent-submission.model';

export interface Client extends WithId, AuditFields {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string | null;
  notes: string;
  /**
   * Denormalized snapshot of this client's most recently CONFIRMED
   * health & safety / details answers, keyed by field key. Used purely to
   * PREFILL a new consultation's early steps — the therapist reviews and
   * edits every field each session, and the new ConsentSubmission is always
   * a fresh, independently-captured record. Never treated as the answer
   * of record on its own.
   */
  lastKnownAnswers: Record<string, ConsentAnswer['value']>;
  lastKnownAnswersUpdatedAt: string | null;
  lastConsultationAt: string | null;
  totalConsultations: number;
  active: boolean;
}
