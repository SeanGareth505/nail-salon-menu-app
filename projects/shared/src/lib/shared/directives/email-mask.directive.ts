import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { EMAIL_PLACEHOLDER, formatEmailInput } from '../../core/utils/email.util';

@Directive({
  selector: 'input[sfEmailMask]',
  standalone: true,
})
export class SfEmailMaskDirective {
  private readonly element = inject(ElementRef<HTMLInputElement>);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  constructor() {
    const input = this.element.nativeElement;
    if (!input.getAttribute('placeholder')) {
      input.setAttribute('placeholder', EMAIL_PLACEHOLDER);
    }
    if (!input.getAttribute('inputmode')) {
      input.setAttribute('inputmode', 'email');
    }
    if (!input.getAttribute('autocomplete')) {
      input.setAttribute('autocomplete', 'email');
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const caret = input.selectionStart ?? input.value.length;
    const before = input.value.slice(0, caret);
    const formatted = formatEmailInput(input.value);
    if (input.value === formatted) return;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(formatted);
    } else {
      input.value = formatted;
    }

    const nextCaret = formatEmailInput(before).length;
    queueMicrotask(() => input.setSelectionRange(nextCaret, nextCaret));
  }
}
