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
            <p class="body-text">{{ field().bodyText }}</p>
          </div>
        }
        @case ('warning') {
          <div class="block warning sf-motion-rise-in">
            <sf-icon name="warning" [size]="18" />
            <div>
              <p class="warning-label">{{ field().label }}</p>
              <p class="body-text">{{ field().bodyText }}</p>
            </div>
          </div>
        }
        @case ('acknowledgement') {
          <label class="ack-row">
            <input
              type="checkbox"
              [id]="field().key"
              [checked]="value() === true"
              [attr.aria-required]="field().required"
              [attr.aria-invalid]="showError() ? 'true' : null"
              [attr.aria-describedby]="showError() ? field().key + '-error' : null"
              (change)="emit($any($event.target).checked)"
            />
            <span class="body-text">{{ field().bodyText || field().label }} @if (field().required) { <span class="req">*</span> }</span>
          </label>
          @if (showError()) {
            <p class="sf-field-error" [id]="field().key + '-error'">{{ fieldErrorMessage() }}</p>
          }
        }
        @default {
          <label class="label" [id]="field().key + '-label'" [attr.for]="field().key">
            {{ field().label }}
            @if (field().required) { <span class="req">*</span> }
          </label>
          @if (field().helpText) { <p class="help">{{ field().helpText }}</p> }

          @switch (field().type) {
            @case ('yes_no') {
              <div class="segmented touch-choice" role="group" [attr.aria-labelledby]="field().key + '-label'">
                <button type="button" [class.active]="value() === 'yes'" [attr.aria-pressed]="value() === 'yes'" (click)="emit('yes')">Yes</button>
                <button type="button" [class.active]="value() === 'no'" [attr.aria-pressed]="value() === 'no'" (click)="emit('no')">No</button>
              </div>
            }
            @case ('yes_no_unsure') {
              <div class="segmented touch-choice" role="group" [attr.aria-labelledby]="field().key + '-label'">
                <button type="button" [class.active]="value() === 'yes'" [attr.aria-pressed]="value() === 'yes'" (click)="emit('yes')">Yes</button>
                <button type="button" [class.active]="value() === 'no'" [attr.aria-pressed]="value() === 'no'" (click)="emit('no')">No</button>
                <button type="button" [class.active]="value() === 'unsure'" [attr.aria-pressed]="value() === 'unsure'" (click)="emit('unsure')">Unsure</button>
              </div>
            }
            @case ('radio') {
              <div class="segmented touch-choice wrap" role="group" [attr.aria-labelledby]="field().key + '-label'">
                @for (opt of field().options; track opt.value) {
                  <button type="button" [class.active]="value() === opt.value" [attr.aria-pressed]="value() === opt.value" (click)="emit(opt.value)">{{ opt.label }}</button>
                }
              </div>
            }
            @case ('dropdown') {
              <select [id]="field().key" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [class.invalid]="showError()" [attr.aria-invalid]="showError() ? 'true' : null" [attr.aria-describedby]="showError() ? field().key + '-error' : null">
                <option value="" disabled selected>Select…</option>
                @for (opt of field().options; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            }
            @case ('multi_select') {
              <div class="segmented touch-choice wrap" role="group" [attr.aria-labelledby]="field().key + '-label'">
                @for (opt of field().options; track opt.value) {
                  <button type="button" [class.active]="isSelected(opt.value)" [attr.aria-pressed]="isSelected(opt.value)" (click)="toggleMulti(opt.value)">{{ opt.label }}</button>
                }
              </div>
            }
            @case ('checkbox') {
              <label class="ack-row">
                <input type="checkbox" [id]="field().key" [attr.aria-required]="field().required" [attr.aria-invalid]="showError() ? 'true' : null" [checked]="value() === true" (change)="emit($any($event.target).checked)" />
                <span>{{ field().placeholder || 'Yes' }}</span>
              </label>
            }
            @case ('textarea') {
              <textarea [id]="field().key" rows="3" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [placeholder]="field().placeholder || ''" [class.invalid]="showError()" [attr.aria-invalid]="showError() ? 'true' : null" [attr.aria-describedby]="showError() ? field().key + '-error' : null"></textarea>
            }
            @case ('date') {
              <input type="date" [id]="field().key" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [class.invalid]="showError()" [attr.aria-invalid]="showError() ? 'true' : null" [attr.aria-describedby]="showError() ? field().key + '-error' : null" />
            }
            @case ('number') {
              <input type="number" [id]="field().key" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [placeholder]="field().placeholder || ''" [class.invalid]="showError()" [attr.aria-invalid]="showError() ? 'true' : null" [attr.aria-describedby]="showError() ? field().key + '-error' : null" />
            }
            @case ('email') {
              <input type="email" sfEmailMask [id]="field().key" [ngModel]="value()" (ngModelChange)="onEmailChange($event)" [class.invalid]="showError()" [attr.aria-invalid]="showError() ? 'true' : null" [attr.aria-describedby]="showError() ? field().key + '-error' : null" />
            }
            @case ('phone') {
              <input type="tel" sfPhoneMask [id]="field().key" [ngModel]="value()" (ngModelChange)="onPhoneChange($event)" [class.invalid]="showError()" [attr.aria-invalid]="showError() ? 'true' : null" [attr.aria-describedby]="showError() ? field().key + '-error' : null" />
            }
            @default {
              <input type="text" [id]="field().key" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [placeholder]="field().placeholder || ''" [class.invalid]="showError()" [attr.aria-invalid]="showError() ? 'true' : null" [attr.aria-describedby]="showError() ? field().key + '-error' : null" />
            }
          }

          @if (showError()) {
            <p class="sf-field-error" [id]="field().key + '-error'" @expandCollapse>{{ fieldErrorMessage() }}</p>
          }

        }
      }
    </div>
  `,
  styles: [`
    .field {
      padding: 18px 0;
      border-bottom: 1px solid var(--sf-border);
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
      color: var(--sf-ink-muted);
      margin-bottom: 8px;
    }
    .req { color: var(--sf-forest); }
    .help { color: var(--sf-ink-muted); font-size: 0.84rem; margin: 0 0 10px; line-height: 1.5; }
    .segmented { display: flex; gap: 10px; flex-wrap: wrap; }
    .segmented.touch-choice button {
      flex: 1 1 0;
      min-width: 88px;
      min-height: 54px;
      padding: 12px 18px;
      border-radius: 12px;
      border: 1.5px solid var(--sf-border-strong);
      background: var(--sf-surface);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.96rem;
      color: var(--sf-ink);
      font-family: var(--sf-font-body);
      transition: border-color var(--sf-dur-fast) var(--sf-ease-standard), background-color var(--sf-dur-fast) var(--sf-ease-standard), color var(--sf-dur-fast) var(--sf-ease-standard), box-shadow var(--sf-dur-fast) var(--sf-ease-standard);
    }
    .segmented.touch-choice button.active {
      border-color: var(--sf-forest);
      background: var(--sf-sage-light);
      color: var(--sf-forest);
      box-shadow: inset 0 0 0 1px var(--sf-border);
    }
    .segmented.touch-choice.wrap button { flex: 1 1 calc(50% - 5px); min-width: 120px; }
    select, textarea, input[type=text], input[type=date], input[type=number], input[type=email], input[type=tel] {
      width: 100%;
      min-height: 52px;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid var(--sf-border-strong);
      font-family: var(--sf-font-body);
      font-size: 1rem;
      margin-top: 0;
      background: var(--sf-surface);
      color: var(--sf-ink);
      box-sizing: border-box;
    }
    textarea { min-height: 120px; line-height: 1.5; resize: vertical; }
    select:focus, textarea:focus, input:focus {
      outline: none;
      border-color: var(--sf-forest);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--sf-forest) 12%, transparent);
    }
    .invalid { border-color: var(--sf-danger); }
    .ack-row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      cursor: pointer;
      padding: 16px 14px;
      border: 1px solid var(--sf-border-strong);
      border-radius: 10px;
      background: var(--sf-surface);
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
    .block.info { background: var(--sf-canvas); flex-direction: column; }
    .block.warning {
      background: var(--sf-status-flagged-bg);
      border-left: 3px solid var(--sf-champagne);
      align-items: flex-start;
    }
    .block.warning sf-icon { color: var(--sf-champagne); flex: none; margin-top: 2px; }
    .warning-label {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.72rem;
      letter-spacing: 0.1em;
      color: var(--sf-status-flagged-fg);
      margin-bottom: 6px;
    }
    .block.warning p:last-child {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.55;
      color: var(--sf-status-flagged-fg);
    }
    .body-text { white-space: pre-line; overflow-wrap: anywhere; margin: 0; font-size: 1rem; line-height: 1.7; }
    .block.info .body-text { color: var(--sf-ink); }
    .block.warning .body-text { font-size: 1rem; line-height: 1.7; }
    .block.warning > div { min-width: 0; }
    .ack-row:has(input:checked) { background: var(--sf-blush); border-color: var(--sf-border-strong); }
    .ack-row:has(input[aria-invalid=true]) { border-color: var(--sf-danger); }
    .ack-row input { accent-color: var(--sf-forest); }
    button:focus-visible { outline: 2px solid var(--sf-forest); outline-offset: 3px; }
    .block.info { background: var(--sf-canvas); }
    .block .sf-eyebrow { margin-bottom: 0; color: var(--sf-forest); }
  `],
})
export class SfDynamicField {
  readonly field = input.required<ConsentField>();
  readonly value = input<unknown>(null);
  readonly valueChange = output<unknown>();

  readonly touched = signal(false);
  readonly showValidation = input(false);

  readonly isBlockType = computed(() => ['information', 'warning', 'acknowledgement'].includes(this.field().type));

  readonly isChoiceField = computed(() => {
    const type = this.field().type;
    return type === 'yes_no' || type === 'yes_no_unsure' || type === 'radio';
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
    if (['information', 'warning'].includes(f.type)) return null;
    if (!this.touched() && !this.showValidation()) return null;

    const v = this.value();
    const empty = v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
    if (f.required && ['acknowledgement', 'checkbox'].includes(f.type) && v !== true) return 'Please confirm this acknowledgement to continue.';
    if (f.required && empty) return 'This field is required.';

    if (!empty && f.type === 'email' && typeof v === 'string' && !isValidEmail(v)) {
      return 'Enter a valid email address.';
    }
    if (!empty && f.type === 'phone' && typeof v === 'string' && !isValidPhone(v)) {
      return 'Enter a valid phone number (e.g. 082 123 4567).';
    }

    return null;
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
