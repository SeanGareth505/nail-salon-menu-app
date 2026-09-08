import { Client } from '../models';
import { formatEmailInput } from './email.util';
import { normalizePhoneKey } from './phone.util';

export type ClientDuplicateField = 'phone' | 'email';

export interface ClientDuplicateResult {
  field: ClientDuplicateField;
  existingClientName: string;
}

export class ClientDuplicateError extends Error {
  readonly field: ClientDuplicateField;
  readonly existingClientName: string;

  constructor(result: ClientDuplicateResult) {
    super(duplicateClientMessage(result));
    this.name = 'ClientDuplicateError';
    this.field = result.field;
    this.existingClientName = result.existingClientName;
  }
}

export function duplicateClientMessage(result: ClientDuplicateResult): string {
  if (result.field === 'phone') {
    return `This phone number is already used by ${result.existingClientName}.`;
  }
  return `This email is already used by ${result.existingClientName}.`;
}

function normalizeEmailKey(value: string): string {
  return formatEmailInput(value);
}

export function findClientDuplicate(
  clients: readonly Pick<Client, 'id' | 'phone' | 'email' | 'fullName'>[],
  input: { phone: string; email: string; excludeId?: string | null },
): ClientDuplicateResult | null {
  const excludeId = input.excludeId ?? null;
  const phoneKey = normalizePhoneKey(input.phone);

  if (phoneKey) {
    for (const client of clients) {
      if (excludeId && client.id === excludeId) continue;
      if (normalizePhoneKey(client.phone) === phoneKey) {
        return { field: 'phone', existingClientName: client.fullName };
      }
    }
  }

  const emailKey = normalizeEmailKey(input.email);
  if (emailKey) {
    for (const client of clients) {
      if (excludeId && client.id === excludeId) continue;
      const existingEmail = normalizeEmailKey(client.email);
      if (existingEmail && existingEmail === emailKey) {
        return { field: 'email', existingClientName: client.fullName };
      }
    }
  }

  return null;
}
