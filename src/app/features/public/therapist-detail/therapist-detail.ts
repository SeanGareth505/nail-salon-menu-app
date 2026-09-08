import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { TherapistsService } from '../../../core/services/therapists.service';
import { SfSalonLoader } from '../../../shared/components/salon-loader/salon-loader';
import { SfPortrait } from '../../../shared/components/portrait/portrait';
import { SfIcon } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-therapist-detail',
  standalone: true,
  imports: [SfIcon, RouterLink, SfSalonLoader, SfPortrait],
  templateUrl: './therapist-detail.html',
  styleUrl: './therapist-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TherapistDetail {
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly location = inject(Location);

  readonly id = input<string>('');
  readonly profileState = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        (id ? this.therapistsSvc.get(id) : of(undefined)).pipe(
          map((therapist) => ({ therapist, loading: false, error: false })),
          startWith({ therapist: undefined, loading: true, error: false }),
          catchError(() => of({ therapist: undefined, loading: false, error: true })),
        ),
      ),
    ),
    { initialValue: { therapist: undefined, loading: true, error: false } },
  );
  readonly therapist = computed(() => this.profileState().therapist);

  back(): void {
    this.location.back();
  }
}
