import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SfBrandMark } from '../../../shared/components/brand-mark/brand-mark';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, SfBrandMark],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly error = signal('');
  readonly loading = signal(false);

  async submit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.signIn(this.email().trim(), this.password());
      await this.router.navigate(['/admin']);
    } catch {
      this.error.set('Incorrect email or password.');
    } finally {
      this.loading.set(false);
    }
  }
}
