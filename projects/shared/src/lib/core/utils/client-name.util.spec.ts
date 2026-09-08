import { normalizeClientNames, splitClientName } from './client-name.util';

describe('client-name.util', () => {
  it('uses first and last name when either is present', () => {
    expect(splitClientName({ firstName: 'Lerato', lastName: '', fullName: 'Lerato Mokoena' })).toEqual({
      firstName: 'Lerato',
      lastName: '',
    });
    expect(splitClientName({ firstName: '', lastName: 'Mokoena', fullName: 'Lerato Mokoena' })).toEqual({
      firstName: '',
      lastName: 'Mokoena',
    });
  });

  it('falls back to full name when separate names are missing', () => {
    expect(splitClientName({ fullName: 'Lerato Mokoena' })).toEqual({
      firstName: 'Lerato',
      lastName: 'Mokoena',
    });
  });

  it('normalizes client names', () => {
    expect(normalizeClientNames({ firstName: 'Lerato', lastName: 'Mokoena', fullName: '' }).fullName).toBe('Lerato Mokoena');
  });
});
