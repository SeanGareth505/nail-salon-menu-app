import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClientsService } from '../../../core/services/clients.service';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfStatePill } from '../../../shared/components/state-pill/state-pill';
import { SfEmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, SfIcon, SfStatePill, SfEmptyState],
  templateUrl: './consultations.html',
  styleUrl: './consultations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Consultations {
  private readonly clientsSvc = inject(ClientsService);
  private readonly consultationsSvc = inject(ConsultationsService);

  readonly search = signal('');
  readonly clients = toSignal(this.clientsSvc.listAll(), { initialValue: [] });
  readonly consultations = toSignal(this.consultationsSvc.listRecent(50), { initialValue: [] });

  readonly filteredClients = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.clients();
    return this.clients().filter(
      (c) => c.fullName.toLowerCase().includes(term) || c.phone.includes(term),
    );
  });

  pillTone(status: string): 'complete' | 'flagged' | 'incomplete' | 'neutral' {
    if (status === 'complete') return 'complete';
    if (status === 'flagged') return 'flagged';
    if (status === 'incomplete' || status === 'in_progress') return 'incomplete';
    return 'neutral';
  }
}
