import { AuditFields, WithId } from './common.model';
import { ConsentAnswer } from './consent-submission.model';

export interface Client extends WithId, AuditFields {
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string | null;
  notes: string;
  lastKnownAnswers: Record<string, ConsentAnswer['value']>;
  lastKnownAnswersUpdatedAt: string | null;
  lastConsultationAt: string | null;
  totalConsultations: number;
  active: boolean;
}
