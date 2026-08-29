import { ConsentField, ConsentFieldCondition } from '../models';

/** Evaluates a field's `conditions` against the answers captured so far. */
export function isFieldVisible(field: ConsentField, answers: Record<string, unknown>): boolean {
  if (!field.conditions || field.conditions.length === 0) return true;
  return field.conditions.every((condition) => evaluateCondition(condition, answers));
}

function evaluateCondition(condition: ConsentFieldCondition, answers: Record<string, unknown>): boolean {
  const actual = answers[condition.dependsOn];
  switch (condition.operator) {
    case 'equals':
      return actual === condition.value;
    case 'not_equals':
      return actual !== condition.value;
    case 'one_of':
      return Array.isArray(condition.value) && condition.value.includes(actual as string);
    case 'is_checked':
      return actual === true;
    case 'is_not_checked':
      return actual !== true;
    default:
      return true;
  }
}

/** A field flags for therapist review when it carries a `warning`/`acknowledgement`
 *  type that is currently visible (i.e. its condition fired). */
export function fieldRequiresReview(field: ConsentField, answers: Record<string, unknown>): boolean {
  return (field.type === 'warning') && isFieldVisible(field, answers);
}
