import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TherapistConsultationUiService {
  readonly hideChrome = signal(false);

  setHideChrome(hide: boolean): void {
    this.hideChrome.set(hide);
  }
}
