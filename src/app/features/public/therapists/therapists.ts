import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TherapistsService } from '../../../core/services/therapists.service';
import { SfTherapistCard } from '../../../shared/components/therapist-card/therapist-card';
import { SfEmptyStateAnimation } from '../../../shared/components/empty-state-animation/empty-state-animation';

@Component({
  selector: 'app-therapists',
  standalone: true,
  imports: [SfTherapistCard, SfEmptyStateAnimation],
  templateUrl: './therapists.html',
  styleUrl: './therapists.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Therapists {
  private readonly therapistsSvc = inject(TherapistsService);
  readonly therapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });
}
