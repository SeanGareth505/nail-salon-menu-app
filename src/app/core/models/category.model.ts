import { AuditFields, WithId } from './common.model';

export interface Category extends WithId, AuditFields {
  name: string;
  slug: string;
  icon: string;       // icon name, matches shared icon set
  tint: 'blush' | 'sage' | 'sky' | 'sand';
  sortOrder: number;
  active: boolean;
}
