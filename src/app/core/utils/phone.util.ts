export const PHONE_LOCAL_PLACEHOLDER = '082 000 0000';
export const PHONE_INTL_PLACEHOLDER = '+27 82 000 0000';
export const PHONE_INPUT_MAX_LENGTH = 16;

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatLocalPhone(digits: string): string {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

function formatInternationalPhone(nationalDigits: string): string {
  const d = nationalDigits.slice(0, 9);
  if (!d.length) return '+27 ';
  if (d.length <= 2) return `+27 ${d}`;
  if (d.length <= 5) return `+27 ${d.slice(0, 2)} ${d.slice(2)}`;
  return `+27 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
}

export function formatPhoneInput(raw: string): string {
  const trimmed = raw.trimStart();
  const digits = phoneDigits(raw);
  if (!digits) return trimmed.startsWith('+') ? '+27 ' : '';

  const prefersInternational = trimmed.startsWith('+') || (digits.startsWith('27') && digits.length > 2 && !raw.trim().startsWith('0'));
  if (prefersInternational) {
    const national = digits.startsWith('27') ? digits.slice(2, 11) : digits.slice(0, 9);
    return formatInternationalPhone(national);
  }

  const local = digits.startsWith('0') ? digits.slice(0, 10) : `0${digits}`.slice(0, 10);
  return formatLocalPhone(local);
}

export function phoneCaretIndex(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index++) {
    if (/\d/.test(formatted[index])) {
      seen++;
      if (seen >= digitCount) return index + 1;
    }
  }
  return formatted.length;
}

export function isValidPhone(value: string): boolean {
  const digits = phoneDigits(value);
  if (digits.length === 10 && digits.startsWith('0')) {
    return /^0[1-9]\d{8}$/.test(digits);
  }
  if (digits.length === 11 && digits.startsWith('27')) {
    return /^27[1-9]\d{8}$/.test(digits);
  }
  return false;
}

export function normalizePhoneKey(value: string): string {
  const digits = phoneDigits(value);
  if (digits.length === 10 && digits.startsWith('0')) {
    return `27${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith('27')) {
    return digits;
  }
  return digits;
}
