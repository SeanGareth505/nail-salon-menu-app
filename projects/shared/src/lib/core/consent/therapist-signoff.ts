import { ConsentSubmission } from '../models/consent-submission.model';

export const THERAPIST_REVIEW_DECLARATION = 'I have reviewed the client’s disclosures and consent, discussed the proposed treatment, relevant risks, alternatives and aftercare, and answered the client’s questions. I have assessed whether it is appropriate to proceed and recorded any relevant precautions or reasons to defer treatment. I confirm that the treatments recorded are accurate.';

export function requiresTherapistSignoff(submission: Pick<ConsentSubmission, 'templateId' | 'templateVersionId' | 'templateVersionNumber'> | null | undefined): boolean {
  return isNailConsentSubmission(submission) || submission?.templateId === 'general-health-safety' && submission.templateVersionId === 'general-health-safety-v2' && submission.templateVersionNumber === 2;
}

export function isNailConsentSubmission(submission: Pick<ConsentSubmission, 'templateId' | 'templateVersionId' | 'templateVersionNumber'> | null | undefined): boolean {
  return submission?.templateId === 'nail-consultation' && submission.templateVersionId === 'nail-consultation-v1' && submission.templateVersionNumber === 1;
}
