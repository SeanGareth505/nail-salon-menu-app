import { AuditFields, WithId } from './common.model';
import { ConsentField, ConsentStepDefinition } from './consent-field.model';

export type ConsentVersionStatus = 'draft' | 'published' | 'archived';

/**
 * A single immutable version of a consent template's questions.
 * Once status is 'published' the steps/fields must never be mutated again —
 * publishing a change always creates a NEW version. Historical submissions
 * point at the exact version they were signed against, so the recorded
 * wording never drifts even if the template evolves later.
 */
export interface ConsentTemplateVersion extends WithId, AuditFields {
  templateId: string;
  versionNumber: number;
  status: ConsentVersionStatus;
  steps: ConsentStepDefinition[];
  fields: ConsentField[];
  publishedAt: string | null;
  publishedBy: string | null;
}
