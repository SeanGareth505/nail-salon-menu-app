import { formatPhoneInput, isValidPhone, normalizePhoneKey, phoneCaretIndex, phoneDigits } from './phone.util';

describe('phone.util', () => {
  it('extracts digits', () => {
    expect(phoneDigits('+27 82 123 4567')).toBe('27821234567');
  });

  it('formats local numbers', () => {
    expect(formatPhoneInput('0821234567')).toBe('082 123 4567');
    expect(formatPhoneInput('082 123')).toBe('082 123');
  });

  it('formats international numbers', () => {
    expect(formatPhoneInput('+27821234567')).toBe('+27 82 123 4567');
    expect(formatPhoneInput('+27 82 123')).toBe('+27 82 123');
  });

  it('tracks caret position after formatting', () => {
    expect(phoneCaretIndex('082 123 4567', 3)).toBe(3);
    expect(phoneCaretIndex('082 123 4567', 6)).toBe(7);
  });

  it('validates local and international numbers', () => {
    expect(isValidPhone('082 123 4567')).toBe(true);
    expect(isValidPhone('+27 82 123 4567')).toBe(true);
    expect(isValidPhone('082 123')).toBe(false);
    expect(isValidPhone('123')).toBe(false);
  });

  it('normalizes phone keys for duplicate checks', () => {
    expect(normalizePhoneKey('082 123 4567')).toBe('27821234567');
    expect(normalizePhoneKey('+27 82 123 4567')).toBe('27821234567');
  });
});
