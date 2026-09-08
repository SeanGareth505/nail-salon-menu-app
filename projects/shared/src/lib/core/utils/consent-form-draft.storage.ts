export type ConsentFormDraftPhase = 'setup' | 'wizard';

export interface ConsentFormDraftClient {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface ConsentFormDraft {
  version: 1;
  savedAt: string;
  phase: ConsentFormDraftPhase;
  selectedClientId: string | null;
  editingClientDetails?: boolean;
  templateId?: string | null;
  templateVersionId?: string | null;
  intendedTreatmentId: string | null;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail: string;
  intendedTherapistId: string | null;
  client: ConsentFormDraftClient | null;
  answers: Record<string, unknown>;
  signatureDataUrl: string | null;
  stepIndex: number;
  therapistReviewed: boolean;
}

const STORAGE_KEY = 'salonflow.consent-form-draft';

export function loadConsentFormDraft(): ConsentFormDraft | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentFormDraft;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsentFormDraft(draft: ConsentFormDraft): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    clearConsentFormDraft();
  }
}

export function clearConsentFormDraft(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
