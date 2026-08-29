import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsentField } from '../../../core/models';
import { SfIcon } from '../icon/icon';
import { expandCollapse } from '../../animations/motion.animations';

@Component({
  selector: 'sf-dynamic-field',
  standalone: true,
  imports: [FormsModule, SfIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [expandCollapse],
  template: `
    <div class="field" [class.block-type]="isBlockType()" @expandCollapse>
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
              <div class="segmented">
                <button type="button" [class.active]="value() === 'yes'" (click)="emit('yes')">Yes</button>
                <button type="button" [class.active]="value() === 'no'" (click)="emit('no')">No</button>
              </div>
            }
            @case ('yes_no_unsure') {
              <div class="segmented">
                <button type="button" [class.active]="value() === 'yes'" (click)="emit('yes')">Yes</button>
                <button type="button" [class.active]="value() === 'no'" (click)="emit('no')">No</button>
                <button type="button" [class.active]="value() === 'unsure'" (click)="emit('unsure')">Unsure</button>
              </div>
            }
            @case ('radio') {
              <div class="segmented wrap">
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
              <div class="segmented wrap">
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
              <input type="email" [id]="field().key" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [placeholder]="field().placeholder || ''" [class.invalid]="showError()" />
            }
            @case ('phone') {
              <input type="tel" [id]="field().key" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [placeholder]="field().placeholder || ''" [class.invalid]="showError()" />
            }
            @default {
              <input type="text" [id]="field().key" [ngModel]="value()" (ngModelChange)="onValueChange($event)" [placeholder]="field().placeholder || ''" [class.invalid]="showError()" />
            }
          }

          @if (showError()) {
            <p class="sf-field-error" @expandCollapse>This field is required.</p>
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
    .field { padding: var(--sf-space-4) 0; border-bottom: 1px solid var(--sf-border); }
    .field:last-child { border-bottom: none; }
    .field.block-type { padding: 0 0 var(--sf-space-4); border-bottom: none; }
    .label { display: block; font-family: var(--sf-font-display); font-size: 1.05rem; margin-bottom: var(--sf-space-1); }
    .req { color: var(--sf-champagne); }
    .help { color: var(--sf-ink-muted); font-size: 0.85rem; margin-bottom: var(--sf-space-2); }
    .segmented { display: flex; gap: var(--sf-space-2); margin-top: var(--sf-space-2); }
    .segmented.wrap { flex-wrap: wrap; }
    .segmented button {
      flex: 1; min-width: 84px; padding: 12px; border-radius: var(--sf-radius-sm); border: 1.5px solid var(--sf-border);
      background: var(--sf-surface); cursor: pointer; font-weight: 600; color: var(--sf-ink); font-family: var(--sf-font-body);
      transition: border-color var(--sf-dur-fast) var(--sf-ease-standard), background-color var(--sf-dur-fast) var(--sf-ease-standard);
    }
    .segmented button.active { border-color: var(--sf-forest); background: var(--sf-sage-light); color: var(--sf-forest-dark); }
    select, textarea, input[type=text], input[type=date], input[type=number], input[type=email], input[type=tel] {
      width: 100%; padding: 12px 14px; border-radius: var(--sf-radius-sm); border: 1.5px solid var(--sf-border);
      font-family: var(--sf-font-body); font-size: 0.95rem; margin-top: var(--sf-space-2); background: var(--sf-surface); color: var(--sf-ink);
      transition: border-color var(--sf-dur-fast) var(--sf-ease-standard);
    }
    .invalid { border-color: #a3453a; }
    .ack-row { display: flex; align-items: flex-start; gap: var(--sf-space-2); cursor: pointer; }
    .ack-row input { margin-top: 3px; }
    .block { border-radius: var(--sf-radius-md); padding: var(--sf-space-4); display: flex; gap: var(--sf-space-3); }
    .block.info { background: var(--sf-sky); flex-direction: column; }
    .block.warning { background: var(--sf-champagne-light); border-left: 3px solid var(--sf-champagne); align-items: flex-start; }
    .block.warning sf-icon { color: var(--sf-champagne); flex: none; margin-top: 2px; }
    .warning-label { font-weight: 700; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.08em; color: #8a6a2f; margin-bottom: 4px; }
    .conditional-detail { margin-top: var(--sf-space-2); overflow: hidden; }
  `],
})
export class SfDynamicField {
  readonly field = input.required<ConsentField>();
  readonly value = input<unknown>(null);
  readonly valueChange = output<unknown>();

  readonly touched = signal(false);
  readonly conditionalValue = signal('');

  readonly isBlockType = computed(() => ['information', 'warning', 'acknowledgement'].includes(this.field().type));

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

  showError(): boolean {
    const f = this.field();
    if (!f.required || ['information', 'warning', 'acknowledgement'].includes(f.type)) return false;
    if (!this.touched()) return false;
    const v = this.value();
    if (v === null || v === undefined || v === '') return true;
    if (Array.isArray(v)) return v.length === 0;
    return false;
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
