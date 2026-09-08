import { findClientDuplicate, duplicateClientMessage } from './client-validation.util';

describe('client-validation.util', () => {
  const clients = [
    { id: '1', fullName: 'Jane Doe', phone: '082 123 4567', email: 'jane@example.com' },
    { id: '2', fullName: 'John Smith', phone: '+27 83 111 2222', email: 'john@example.com' },
  ];

  it('detects duplicate local phone numbers', () => {
    const result = findClientDuplicate(clients, {
      phone: '082 123 4567',
      email: 'new@example.com',
    });
    expect(result).toEqual({ field: 'phone', existingClientName: 'Jane Doe' });
  });

  it('treats local and international formats as the same number', () => {
    const result = findClientDuplicate(clients, {
      phone: '+27 82 123 4567',
      email: 'new@example.com',
    });
    expect(result?.field).toBe('phone');
  });

  it('detects duplicate emails case-insensitively', () => {
    const result = findClientDuplicate(clients, {
      phone: '084 000 0000',
      email: 'JANE@Example.COM',
    });
    expect(result).toEqual({ field: 'email', existingClientName: 'Jane Doe' });
  });

  it('excludes the current client when editing', () => {
    const result = findClientDuplicate(clients, {
      phone: '082 123 4567',
      email: 'jane@example.com',
      excludeId: '1',
    });
    expect(result).toBeNull();
  });

  it('formats duplicate messages', () => {
    expect(
      duplicateClientMessage({ field: 'phone', existingClientName: 'Jane Doe' }),
    ).toContain('Jane Doe');
  });
});
