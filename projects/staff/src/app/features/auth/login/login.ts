import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { APP_ENVIRONMENT } from '@core/environment/app-environment';
import { AuthService } from '@core/auth/auth.service';
import { SalonIdentityService } from '@core/services/salon-identity.service';
import { SfIcon } from '@shared/components/icon/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, SfIcon],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly environment = inject(APP_ENVIRONMENT);

  readonly identity = inject(SalonIdentityService);
  readonly menuUrl = this.environment.publicOrigin;
  readonly email = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);
  readonly error = signal('');
  readonly loading = signal(false);

  async submit(): Promise<void> {
    if (this.loading()) return;
    if (!this.email().trim() || !this.password()) {
      this.error.set('Enter your email and password to continue.');
      return;
    }
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.signIn(this.email().trim(), this.password());
      await this.router.navigate(['/admin']);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      this.error.set(
        code === 'auth/network-request-failed'
          ? 'Check your internet connection and try again.'
          : code === 'auth/too-many-requests'
            ? 'Too many sign-in attempts. Please wait a moment and try again.'
            : 'The email or password is incorrect. Please try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
