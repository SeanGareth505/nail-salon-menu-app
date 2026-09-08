export const THERAPIST_AUTH_DOMAIN = 'staff.salonflow.internal';

export function therapistAuthEmail(therapistId: string): string {
  return `t-${therapistId}@${THERAPIST_AUTH_DOMAIN}`;
}

export const THERAPIST_PIN_LENGTH = 6;

const THERAPIST_EMAIL = /^t-(.+)@staff\.salonflow\.internal$/;

export function isTherapistAuthEmail(email: string | null | undefined): boolean {
  return !!email && THERAPIST_EMAIL.test(email);
}

export function therapistIdFromAuthEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const match = email.match(THERAPIST_EMAIL);
  return match?.[1] ?? null;
}
