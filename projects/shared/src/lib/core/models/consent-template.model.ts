import { AuditFields, WithId } from './common.model';

export interface ConsentTemplate extends WithId, AuditFields {
  name: string;
  description: string;
  treatmentIds: string[];        // treatments this template applies to
  currentPublishedVersionId: string | null;
  draftVersionId: string | null;
  active: boolean;
  isSystemDefault?: boolean;
}

export function isConsentFormLive(
  template: Pick<ConsentTemplate, 'active' | 'currentPublishedVersionId'> | null | undefined,
): boolean {
  return !!template && template.active !== false && !!template.currentPublishedVersionId;
}
