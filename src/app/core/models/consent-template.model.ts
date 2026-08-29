import { AuditFields, WithId } from './common.model';

export interface ConsentTemplate extends WithId, AuditFields {
  name: string;
  description: string;
  treatmentIds: string[];        // treatments this template applies to
  currentPublishedVersionId: string | null;
  draftVersionId: string | null;
  active: boolean;
}
