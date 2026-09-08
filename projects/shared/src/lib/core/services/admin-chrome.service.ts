import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminChromeService {
  private readonly handler = signal<(() => void) | null>(null);
  private readonly hidden = signal(false);

  readonly pageActionHandler = this.handler.asReadonly();
  readonly pageActionHidden = this.hidden.asReadonly();

  registerPageAction(handler: () => void): void {
    this.handler.set(handler);
    this.hidden.set(false);
  }

  hidePageAction(): void {
    this.hidden.set(true);
  }

  clearPageAction(): void {
    this.handler.set(null);
    this.hidden.set(false);
  }

  triggerPageAction(): void {
    this.handler()?.();
  }
}
