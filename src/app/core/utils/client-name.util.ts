export function clientFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function splitClientName(client: {
  fullName?: string;
  firstName?: string;
  lastName?: string;
}): { firstName: string; lastName: string } {
  const first = client.firstName?.trim() ?? '';
  const last = client.lastName?.trim() ?? '';
  if (first || last) {
    return { firstName: first, lastName: last };
  }

  const parts = (client.fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: '', lastName: '' };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function normalizeClientNames<T extends { firstName?: string; lastName?: string; fullName?: string }>(
  client: T,
): T & { firstName: string; lastName: string; fullName: string } {
  const { firstName, lastName } = splitClientName(client);
  return {
    ...client,
    firstName,
    lastName,
    fullName: clientFullName(firstName, lastName),
  };
}
