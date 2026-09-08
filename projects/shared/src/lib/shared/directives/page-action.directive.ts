import { Directive, effect, inject, input } from '@angular/core';
import { AdminChromeService } from '../../core/services/admin-chrome.service';

@Directive({
  selector: '[sfPageAction]',
  standalone: true,
})
export class SfPageActionDirective {
  private readonly chrome = inject(AdminChromeService);

  readonly sfPageAction = input.required<() => void>();

  constructor() {
    effect((onCleanup) => {
      const handler = this.sfPageAction();
      this.chrome.registerPageAction(handler);
      onCleanup(() => this.chrome.clearPageAction());
    });
  }
}
