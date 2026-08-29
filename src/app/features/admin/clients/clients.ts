import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ClientsService } from '../../../core/services/clients.service';
import { ConsultationsService } from '../../../core/services/consultations.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './clients.html',
  styleUrl: './clients.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clients {
  private readonly clientsSvc = inject(ClientsService);
  private readonly consultationsSvc = inject(ConsultationsService);

  readonly clients = toSignal(this.clientsSvc.listAll(), { initialValue: [] });
  readonly consultations = toSignal(this.consultationsSvc.listRecent(500), { initialValue: [] });
  readonly search = signal('');

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.clients();
    return this.clients().filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  });

  lastVisit(clientId: string): string | null {
    return this.consultations().find((c) => c.clientId === clientId)?.startedAt ?? null;
  }
}
