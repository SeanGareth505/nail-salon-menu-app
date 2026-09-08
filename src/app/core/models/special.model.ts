import { AuditFields, Money, WithId } from './common.model';

export type SpecialState = 'draft' | 'scheduled' | 'live' | 'expired';
export type SpecialKind = 'single' | 'bundle' | 'promo';
export type SpecialDiscountType = 'fixed' | 'percent' | 'amount';

export interface Special extends WithId, AuditFields {
  kind: SpecialKind;
  title: string;
  scriptTitle: string;
  description: string;
  treatmentIds: string[];
  discountType: SpecialDiscountType;
  price: Money;
  originalPrice: Money;
  percentOff?: number | null;
  amountOff?: number | null;
  startsAt: string;
  endsAt: string;
  therapistIds: string[];
  finePrint: string;
  isDraft: boolean;
  sortOrder: number;
  featured: boolean;
  treatmentId?: string | null;
  state?: SpecialState;
}
