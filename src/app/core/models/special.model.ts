import { AuditFields, Money, WithId } from './common.model';

export type SpecialState = 'draft' | 'scheduled' | 'live' | 'expired';

export interface Special extends WithId, AuditFields {
  title: string;
  scriptTitle: string;        // shown in the script-font panel
  treatmentId: string | null;
  description: string;
  price: Money;
  originalPrice: Money;
  startsAt: string;           // ISO date
  endsAt: string;             // ISO date
  therapistIds: string[];
  finePrint: string;
  state: SpecialState;
}
