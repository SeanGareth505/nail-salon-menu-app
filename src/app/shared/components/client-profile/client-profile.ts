import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ClientsService } from '../../../core/services/clients.service';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { ConsentSubmissionsService } from '../../../core/services/consent-submissions.service';
import { SfStatePill } from '../state-pill/state-pill';
import { SfEmptyState } from '../empty-state/empty-state';

export type ClientProfileArea = 'admin' | 'therapist';

@Component({
  selector: 'sf-client-profile',
  standalone: true,
  imports: [RouterLink, DatePipe, SfStatePill, SfEmptyState],
  templateUrl: './client-profile.html',
  styleUrl: './client-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SfClientProfile {
  private readonly clientsSvc = inject(ClientsService);
  private readonly consultationsSvc = inject(ConsultationsService);
  private readonly submissionsSvc = inject(ConsentSubmissionsService);

  readonly id = input.required<string>();
  readonly area = input<ClientProfileArea>('therapist');

  readonly isAdminView = computed(() => this.area() === 'admin');
  readonly backLink = computed(() => (this.isAdminView() ? '/admin/clients' : '/therapist/consultations'));

  readonly client = toSignal(
    toObservable(this.id).pipe(switchMap((id) => (id ? this.clientsSvc.get(id) : []))),
    { initialValue: undefined },
  );

  readonly consultations = toSignal(
    toObservable(this.id).pipe(switchMap((id) => (id ? this.consultationsSvc.listForClient(id) : []))),
    { initialValue: [] },
  );

  readonly submissions = toSignal(
    toObservable(this.id).pipe(switchMap((id) => (id ? this.submissionsSvc.listForClient(id) : []))),
    { initialValue: [] },
  );

  pillTone(status: string): 'complete' | 'flagged' | 'incomplete' | 'neutral' {
    if (status === 'complete') return 'complete';
    if (status === 'flagged') return 'flagged';
    if (status === 'incomplete' || status === 'in_progress') return 'incomplete';
    return 'neutral';
  }

  formatWhen(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate();
    }
    return null;
  }
}
