import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { SfTherapistRail } from '../../shared/components/therapist-rail/therapist-rail';

@Component({
  selector: 'app-therapist-shell',
  standalone: true,
  imports: [RouterOutlet, SfTherapistRail],
  templateUrl: './therapist-shell.html',
  styleUrl: './therapist-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TherapistShell {
  private readonly router = inject(Router);

  readonly isWizard = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url.includes('/consultations/new')),
      startWith(this.router.url.includes('/consultations/new')),
    ),
    { initialValue: this.router.url.includes('/consultations/new') },
  );
}
