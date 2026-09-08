/** The dynamic field types the consent/consultation form builder supports. */
export type ConsentFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'yes_no'
  | 'yes_no_unsure'
  | 'dropdown'
  | 'radio'
  | 'multi_select'
  | 'checkbox'
  | 'information'
  | 'warning'
  | 'acknowledgement'
  | 'signature'
  | 'image';

export type ConditionOperator = 'equals' | 'not_equals' | 'one_of' | 'is_checked' | 'is_not_checked';

export interface ConsentFieldCondition {
  /** fieldKey this rule depends on */
  dependsOn: string;
  operator: ConditionOperator;
  /** value(s) to compare against, e.g. 'yes', ['yes','unsure'] */
  value: string | string[] | boolean;
}

export interface ConsentFieldOption {
  label: string;
  value: string;
}

export interface ConsentField {
  key: string;               // stable machine key, e.g. 'retinoid_use'
  type: ConsentFieldType;
  label: string;
  helpText?: string;
  placeholder?: string;
  required: boolean;
  options?: ConsentFieldOption[];       // dropdown / radio / multi_select
  /** shown only when ALL conditions pass */
  conditions?: ConsentFieldCondition[];
  /** for warning/information/acknowledgement blocks */
  bodyText?: string;
  /** groups fields into a step; steps are rendered in array order */
  step: string;               // step key, e.g. 'health_safety'
  sortOrder: number;
}

export interface ConsentStepDefinition {
  key: string;
  title: string;
  subtitle?: string;
  sortOrder: number;
}
