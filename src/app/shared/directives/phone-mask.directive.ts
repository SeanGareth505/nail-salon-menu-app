import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import {
  formatPhoneInput,
  PHONE_INPUT_MAX_LENGTH,
  PHONE_LOCAL_PLACEHOLDER,
  phoneCaretIndex,
  phoneDigits,
} from '../../core/utils/phone.util';

@Directive({
  selector: 'input[sfPhoneMask]',
  standalone: true,
})
export class SfPhoneMaskDirective {
  private readonly element = inject(ElementRef<HTMLInputElement>);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  constructor() {
    const input = this.element.nativeElement;
    if (!input.getAttribute('placeholder')) {
      input.setAttribute('placeholder', PHONE_LOCAL_PLACEHOLDER);
    }
    if (!input.getAttribute('maxlength')) {
      input.setAttribute('maxlength', String(PHONE_INPUT_MAX_LENGTH));
    }
    if (!input.getAttribute('inputmode')) {
      input.setAttribute('inputmode', 'tel');
    }
    if (!input.getAttribute('autocomplete')) {
      input.setAttribute('autocomplete', 'tel-national');
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBefore = phoneDigits(input.value.slice(0, caret)).length;
    const formatted = formatPhoneInput(input.value);
    if (input.value === formatted) return;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(formatted);
    } else {
      input.value = formatted;
    }

    const nextCaret = phoneCaretIndex(formatted, digitsBefore);
    queueMicrotask(() => input.setSelectionRange(nextCaret, nextCaret));
  }
}
