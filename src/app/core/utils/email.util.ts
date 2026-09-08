export const EMAIL_PLACEHOLDER = 'name@example.com';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formatEmailInput(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(formatEmailInput(value));
}
