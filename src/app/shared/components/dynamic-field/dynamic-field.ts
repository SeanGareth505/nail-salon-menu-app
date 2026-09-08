import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsentField } from '../../../core/models';
import { isValidEmail, formatEmailInput } from '../../../core/utils/email.util';
import { formatPhoneInput, isValidPhone } from '../../../core/utils/phone.util';
import { SfIcon } from '../icon/icon';
import { SfPhoneMaskDirective } from '../../directives/phone-mask.directive';
import { SfEmailMaskDirective } from '../../directives/email-mask.directive';
import { expandCollapse } from '../../animations/motion.animations';

@Component({
  selector: 'sf-dynamic-field',
  standalone: true,
  imports: [FormsModule, SfIcon, SfPhoneMaskDirective, SfEmailMaskDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [expandCollapse],
  template: `
    <div class="field" [class.block-type]="isBlockType()" [class.choice-field]="isChoiceField()" @expandCollapse>
      @switch (field().type) {
        @case ('information') {
          <div class="block info sf-motion-fade-in">
            <p class="sf-eyebrow">{{ field().label }}</p>
            <p>{{ field().bodyText }}</p>
          </div>
        }
        @case ('warning') {
          <div class="block warning sf-motion-rise-in">
            <sf-icon name="warning" [size]="18" />
            <div>
              <p class="warning-label">{{ field().label }}</p>
              <p>{{ field().bodyText }}</p>
            </div>
          </div>
        }
        @case ('acknowledgement') {
          <label class="ack-row">
            <input
              type="checkbox"
              [checked]="value() === true"
              (change)="emit($any($event.target).checked)"
            />
            <span>{{ field().bodyText || field().label }}</span>
          </label>
        }
        @default {
          <label class="label" [attr.for]="field().key">
            {{ field().label }}
            @if (field().required) { <span class="req">*</span> }
          </label>
          @if (field().helpText) { <p class="help">{{ field().helpText }}</p> }

          @switch (field().type) {
            @case ('yes_no') {
              <div class="segmented touch-choice">
                <button type="button" [class.active]="value() === 'yes'" (click)="emit('yes')">Yes</button>
                <button type="button" [class.active]="value() === 'no'" (click)="emit('no')">No</button>
              </div>
            }
            @case ('yes_no_unsure') {
              <div class="segmented touch-choice">
                <button type="button" [class.active]="value() === 'yes'" (click)="emit('yes')">Yes</button>
                <button type="button" [class.active]="value() === 'no'" (click)="emit('no')">No</button>
                <button type="button" [class.active]="value() === 'unsure'" (click)="emit('unsure')">Unsure</button>
              </div>
            }
            @case ('radio') {
              <div class="segmented touch-choice wrap">
                @for (opt of field().options; track opt.value) {
                  <button type="button" [class.active]="value() === opt.value" (click)="emit(opt.value)">{{ opt.label }}</button>
                }
              </div>
            }
            @case ('dropdown') {
              <select [id]="field().key" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [class.invalid]="showError()">
                <option value="" disabled selected>Select…</option>
                @for (opt of field().options; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            }
            @case ('multi_select') {
              <div class="segmented touch-choice wrap">
                @for (opt of field().options; track opt.value) {
                  <button type="button" [class.active]="isSelected(opt.value)" (click)="toggleMulti(opt.value)">{{ opt.label }}</button>
                }
              </div>
            }
            @case ('checkbox') {
              <label class="ack-row">
                <input type="checkbox" [checked]="value() === true" (change)="emit($any($event.target).checked)" />
                <span>{{ field().placeholder || 'Yes' }}</span>
              </label>
            }
            @case ('textarea') {
              <textarea [id]="field().key" rows="3" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [placeholder]="field().placeholder || ''" [class.invalid]="showError()"></textarea>
            }
            @case ('date') {
              <input type="date" [id]="field().key" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [class.invalid]="showError()" />
            }
            @case ('number') {
              <input type="number" [id]="field().key" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [placeholder]="field().placeholder || ''" [class.invalid]="showError()" />
            }
            @case ('email') {
              <input type="email" sfEmailMask [id]="field().key" [ngModel]="value()" (ngModelChange)="onEmailChange($event)" [class.invalid]="showError()" />
            }
            @case ('phone') {
              <input type="tel" sfPhoneMask [id]="field().key" [ngModel]="value()" (ngModelChange)="onPhoneChange($event)" [class.invalid]="showError()" />
            }
            @default {
              <input type="text" [id]="field().key" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [placeholder]="field().placeholder || ''" [class.invalid]="showError()" />
            }
          }

          @if (showError()) {
            <p class="sf-field-error" @expandCollapse>{{ fieldErrorMessage() }}</p>
          }

          @if (showConditionalDetail()) {
            <div class="conditional-detail" @expandCollapse>
              <textarea rows="3" [ngModel]="conditionalValue()" (ngModelChange)="conditionalValue.set($event); emitConditional()" [placeholder]="conditionalPlaceholder()"></textarea>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .field {
      padding: 18px 0;
      border-bottom: 1px solid rgba(74, 107, 87, 0.1);
    }
    .field:last-child { border-bottom: none; padding-bottom: 0; }
    .field.block-type { padding: 0 0 12px; border-bottom: none; }
    .field.choice-field {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding: 20px 0;
    }
    .choice-field .label {
      flex: none;
      font-family: var(--sf-font-display);
      font-size: 1.05rem;
      font-weight: 400;
      line-height: 1.45;
      color: var(--sf-ink);
      margin-bottom: 0;
    }
    .choice-field .help {
      flex: none;
      margin-top: -4px;
      font-size: 0.88rem;
      line-height: 1.5;
    }
    .choice-field .segmented { width: 100%; margin-left: 0; }
    .choice-field .sf-field-error,
    .choice-field .conditional-detail { flex: none; width: 100%; }
    .label {
      display: block;
      font-family: var(--sf-font-display);
      font-size: 1rem;
      font-weight: 400;
      line-height: 1.4;
      color: var(--sf-ink);
      margin-bottom: 8px;
    }
    .field:not(.choice-field) .label {
      font-family: var(--sf-font-body);
      font-size: 0.82rem;
      font-weight: 500;
      letter-spacing: 0.03em;
      color: rgba(51, 51, 51, 0.72);
      margin-bottom: 8px;
    }
    .req { color: #a8874c; }
    .help { color: var(--sf-ink-muted); font-size: 0.84rem; margin: 0 0 10px; line-height: 1.5; }
    .segmented { display: flex; gap: 10px; flex-wrap: wrap; }
    .segmented.touch-choice button {
      flex: 1 1 0;
      min-width: 88px;
      min-height: 54px;
      padding: 12px 18px;
      border-radius: 12px;
      border: 1.5px solid rgba(74,107,87,.18);
      background: #faf9f6;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.96rem;
      color: rgba(51,51,51,.78);
      font-family: var(--sf-font-body);
      transition: border-color var(--sf-dur-fast) var(--sf-ease-standard), background-color var(--sf-dur-fast) var(--sf-ease-standard), color var(--sf-dur-fast) var(--sf-ease-standard), box-shadow var(--sf-dur-fast) var(--sf-ease-standard);
    }
    .segmented.touch-choice button.active {
      border-color: var(--sf-forest);
      background: var(--sf-sage-light);
      color: var(--sf-forest);
      box-shadow: inset 0 0 0 1px rgba(74,107,87,.08);
    }
    .segmented.touch-choice.wrap button { flex: 1 1 calc(50% - 5px); min-width: 120px; }
    select, textarea, input[type=text], input[type=date], input[type=number], input[type=email], input[type=tel] {
      width: 100%;
      min-height: 52px;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid rgba(74, 107, 87, 0.22);
      font-family: var(--sf-font-body);
      font-size: 1rem;
      margin-top: 0;
      background: #fff;
      color: var(--sf-ink);
      box-sizing: border-box;
    }
    textarea { min-height: 120px; line-height: 1.5; resize: vertical; }
    select:focus, textarea:focus, input:focus {
      outline: none;
      border-color: var(--sf-forest);
      box-shadow: 0 0 0 3px rgba(74, 107, 87, 0.12);
    }
    .invalid { border-color: #a3453a; }
    .ack-row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      cursor: pointer;
      padding: 16px 14px;
      border: 1px solid rgba(74, 107, 87, 0.18);
      border-radius: 10px;
      background: #fff;
      font-size: 0.95rem;
      line-height: 1.45;
    }
    .ack-row input { width: 22px; height: 22px; margin-top: 2px; flex: none; }
    .block {
      border-radius: 10px;
      padding: 16px 18px;
      display: flex;
      gap: 12px;
    }
    .block.info { background: var(--sf-sky); flex-direction: column; }
    .block.warning {
      background: #fdf3e7;
      border-left: 3px solid var(--sf-champagne);
      align-items: flex-start;
    }
    .block.warning sf-icon { color: var(--sf-champagne); flex: none; margin-top: 2px; }
    .warning-label {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.72rem;
      letter-spacing: 0.1em;
      color: #8a6a2e;
      margin-bottom: 6px;
    }
    .block.warning p:last-child {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.55;
      color: #6b542a;
    }
    .conditional-detail { margin-top: 4px; overflow: hidden; }
  `],
})
export class SfDynamicField {
  readonly field = input.required<ConsentField>();
  readonly value = input<unknown>(null);
  readonly valueChange = output<unknown>();

  readonly touched = signal(false);
  readonly conditionalValue = signal('');

  readonly isBlockType = computed(() => ['information', 'warning', 'acknowledgement'].includes(this.field().type));

  readonly isChoiceField = computed(() => {
    const type = this.field().type;
    return type === 'yes_no' || type === 'yes_no_unsure' || type === 'radio';
  });

  readonly showConditionalDetail = computed(() => {
    const f = this.field();
    const v = this.value();
    if (!f.key.includes('medication') && !f.label.toLowerCase().includes('medication')) return false;
    return v === 'yes';
  });

  emit(v: unknown): void {
    this.touched.set(true);
    this.valueChange.emit(v);
  }

  onValueChange(v: unknown): void {
    this.touched.set(true);
    this.valueChange.emit(v);
  }

  onPhoneChange(v: unknown): void {
    this.touched.set(true);
    this.valueChange.emit(typeof v === 'string' ? formatPhoneInput(v) : v);
  }

  onEmailChange(v: unknown): void {
    this.touched.set(true);
    this.valueChange.emit(typeof v === 'string' ? formatEmailInput(v) : v);
  }

  showError(): boolean {
    return this.fieldErrorMessage() !== null;
  }

  fieldErrorMessage(): string | null {
    const f = this.field();
    if (['information', 'warning', 'acknowledgement'].includes(f.type)) return null;
    if (!this.touched()) return null;

    const v = this.value();
    const empty = v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
    if (f.required && empty) return 'This field is required.';

    if (!empty && f.type === 'email' && typeof v === 'string' && !isValidEmail(v)) {
      return 'Enter a valid email address.';
    }
    if (!empty && f.type === 'phone' && typeof v === 'string' && !isValidPhone(v)) {
      return 'Enter a valid phone number (e.g. 082 123 4567).';
    }

    return null;
  }

  conditionalPlaceholder(): string {
    return 'Please provide details…';
  }

  emitConditional(): void {
    this.valueChange.emit(this.conditionalValue());
  }

  isSelected(optValue: string): boolean {
    const v = this.value();
    return Array.isArray(v) && v.includes(optValue);
  }

  toggleMulti(optValue: string): void {
    const current = Array.isArray(this.value()) ? [...(this.value() as string[])] : [];
    const idx = current.indexOf(optValue);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(optValue);
    this.emit(current);
  }
}
