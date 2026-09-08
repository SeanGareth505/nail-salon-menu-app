import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TherapistConsultationUiService } from '@core/services/therapist-consultation-ui.service';
import { SfTherapistRail } from '@shared/components/therapist-rail/therapist-rail';

@Component({
  selector: 'app-therapist-shell',
  standalone: true,
  imports: [RouterOutlet, SfTherapistRail],
  templateUrl: './therapist-shell.html',
  styleUrl: './therapist-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TherapistShell {
  readonly shellUi = inject(TherapistConsultationUiService);
}
