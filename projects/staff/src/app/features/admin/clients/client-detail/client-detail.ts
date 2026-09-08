import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ClientsService } from '@core/services/clients.service';
import { ConsultationsService } from '@core/services/consultations.service';
import { SfStatePill } from '@shared/components/state-pill/state-pill';
import { SfEmptyState } from '@shared/components/empty-state/empty-state';
import { consultationTreatmentLabel } from '@core/utils/consultation-treatment.util';
import { Consultation } from '@core/models';
import { SfConsultationCard } from '@shared/components/consultation-card/consultation-card';

@Component({
  selector: 'app-admin-client-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, SfStatePill, SfEmptyState, SfConsultationCard],
  templateUrl: './client-detail.html',
  styleUrl: './client-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminClientDetail {
  private readonly clientsSvc = inject(ClientsService);
  private readonly consultationsSvc = inject(ConsultationsService);

  readonly id = input<string>('');

  readonly client = toSignal(
    toObservable(this.id).pipe(switchMap((id) => (id ? this.clientsSvc.get(id) : of(undefined)))),
    { initialValue: undefined },
  );

  readonly consultations = toSignal(
    toObservable(this.id).pipe(switchMap((id) => (id ? this.consultationsSvc.listForClient(id) : of([])))),
    { initialValue: [] },
  );

  readonly expanded = signal<Set<string>>(new Set());

  toggleCard(consultationId: string): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      if (next.has(consultationId)) next.delete(consultationId);
      else next.add(consultationId);
      return next;
    });
  }

  isExpanded(consultationId: string): boolean {
    return this.expanded().has(consultationId);
  }

  pillTone(status: string): 'complete' | 'flagged' | 'incomplete' | 'neutral' {
    if (status === 'complete') return 'complete';
    if (status === 'flagged') return 'flagged';
    if (status === 'incomplete' || status === 'in_progress') return 'incomplete';
    return 'neutral';
  }

  treatmentLabel(record: Consultation): string {
    return consultationTreatmentLabel(record);
  }
}
