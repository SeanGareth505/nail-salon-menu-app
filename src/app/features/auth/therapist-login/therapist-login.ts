import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { Therapist } from '../../../core/models';
import { therapistAuthEmail, THERAPIST_PIN_LENGTH } from '../../../core/auth/therapist-auth.util';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfBrandMark } from '../../../shared/components/brand-mark/brand-mark';

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

@Component({
  selector: 'app-therapist-login',
  standalone: true,
  imports: [SfIcon, SfBrandMark],
  templateUrl: './therapist-login.html',
  styleUrl: './therapist-login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TherapistLogin {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly therapistsSvc = inject(TherapistsService);

  private readonly allTherapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] as Therapist[] });
  /** Only therapists an admin has actually linked a login account to appear on the pad. */
  readonly therapists = () => this.allTherapists().filter((t) => t.pinEnabled);

  readonly padKeys = PAD_KEYS;
  readonly selected = signal<Therapist | null>(null);
  readonly pin = signal('');
  readonly error = signal('');
  readonly loading = signal(false);

  choose(t: Therapist): void {
    this.selected.set(t);
    this.pin.set('');
    this.error.set('');
  }

  back(): void {
    this.selected.set(null);
    this.pin.set('');
    this.error.set('');
  }

  press(key: string): void {
    if (this.loading()) return;
    if (key === 'back') {
      this.pin.update((p) => p.slice(0, -1));
      return;
    }
    if (!key || this.pin().length >= THERAPIST_PIN_LENGTH) return;
    this.pin.update((p) => p + key);
    if (this.pin().length === THERAPIST_PIN_LENGTH) this.submit();
  }

  private async submit(): Promise<void> {
    const t = this.selected();
    if (!t) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.signIn(therapistAuthEmail(t.id), this.pin());
      const to = this.route.snapshot.queryParamMap.get('to');
      const redirect = this.route.snapshot.queryParamMap.get('redirect');
      const target =
        to && to.startsWith('/therapist') ? to : redirect === 'admin' ? '/admin' : '/therapist';
      await this.router.navigateByUrl(target);
    } catch {
      this.error.set('That PIN didn’t match. Try again.');
      this.pin.set('');
    } finally {
      this.loading.set(false);
    }
  }
}
