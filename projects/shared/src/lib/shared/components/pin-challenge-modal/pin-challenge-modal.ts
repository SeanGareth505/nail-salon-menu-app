import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { SfIcon } from '../icon/icon';
import { THERAPIST_PIN_LENGTH } from '../../../core/auth/therapist-auth.util';

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

@Component({
  selector: 'sf-pin-challenge-modal',
  standalone: true,
  imports: [SfIcon],
  templateUrl: './pin-challenge-modal.html',
  styleUrl: './pin-challenge-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SfPinChallengeModal {
  readonly open = input(false);
  readonly title = input('Enter therapist PIN');
  readonly subtitle = input('Confirm your PIN to exit client form mode.');
  readonly loading = input(false);
  readonly error = input('');
  readonly verified = output<string>();
  readonly dismissed = output<void>();

  readonly padKeys = PAD_KEYS;
  readonly pin = signal('');

  constructor() {
    effect(() => {
      if (this.open()) this.pin.set('');
    });
  }

  press(key: string): void {
    if (this.loading()) return;
    if (key === 'back') {
      this.pin.update((p) => p.slice(0, -1));
      return;
    }
    if (!key || this.pin().length >= THERAPIST_PIN_LENGTH) return;
    const next = this.pin() + key;
    this.pin.set(next);
    if (next.length === THERAPIST_PIN_LENGTH) this.verified.emit(next);
  }

  dismiss(): void {
    this.pin.set('');
    this.dismissed.emit();
  }
}
