import { SalonHours } from '../models';

const DAY_MAP: Record<number, SalonHours['day']> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

function parseMinutes(value: string | null): number | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function findTodayHours(hours: SalonHours[], now: Date): SalonHours | undefined {
  const today = DAY_MAP[now.getDay()];
  const weekday = hours.find((h) => h.day === today);
  if (weekday) return weekday;
  return hours.find((h) => h.day === 'monday' && h.label.includes('–'));
}

export function getSalonOpenStatus(hours: SalonHours[] | undefined, now = new Date()): string {
  if (!hours?.length) return 'Hours unavailable';

  const today = findTodayHours(hours, now);
  if (!today) return 'Closed today';

  if (today.byAppointmentOnly) return 'By appointment only';
  if (!today.open || !today.close) return 'Closed today';

  const openMin = parseMinutes(today.open);
  const closeMin = parseMinutes(today.close);
  if (openMin === null || closeMin === null) return 'Closed today';

  const currentMin = now.getHours() * 60 + now.getMinutes();
  if (currentMin >= openMin && currentMin < closeMin) return 'Open now';
  if (currentMin < openMin) return `Opens at ${today.open}`;
  return 'Closed now';
}
