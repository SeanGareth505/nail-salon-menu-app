import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { Location } from '@angular/common';
import { TherapistsService } from '../../../core/services/therapists.service';
import { SfIcon } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-therapist-detail',
  standalone: true,
  imports: [SfIcon],
  templateUrl: './therapist-detail.html',
  styleUrl: './therapist-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TherapistDetail {
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly location = inject(Location);

  readonly id = input<string>('');
  readonly therapist = toSignal(
    toObservable(this.id).pipe(switchMap((id) => (id ? this.therapistsSvc.get(id) : []))),
    { initialValue: undefined },
  );

  back(): void {
    this.location.back();
  }
}
