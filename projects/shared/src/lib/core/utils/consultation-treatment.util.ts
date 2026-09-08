import { Consultation } from '../models';

export function consultationTreatmentNames(record: Consultation): string[] {
  if (record.treatmentNames?.length) return [...record.treatmentNames];
  if (record.treatmentName) {
    return record.treatmentName
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
  }
  if (record.treatmentOthers?.length) return [...record.treatmentOthers];
  if (record.treatmentOther) {
    return record.treatmentOther
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
  }
  return [];
}

export function consultationTreatmentLabel(record: Consultation): string {
  const names = consultationTreatmentNames(record);
  if (names.length) return names.join(', ');
  return 'Not recorded';
}
