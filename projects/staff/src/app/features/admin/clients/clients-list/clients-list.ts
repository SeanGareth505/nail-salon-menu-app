import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ClientsService } from '@core/services/clients.service';

@Component({
  selector: 'app-admin-clients-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './clients-list.html',
  styleUrl: './clients-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsList {
  private readonly clientsSvc = inject(ClientsService);

  readonly clients = toSignal(this.clientsSvc.listAll(), { initialValue: [] });
  readonly search = signal('');

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.clients();
    return this.clients().filter(
      (c) =>
        c.fullName.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        (c.email ?? '').toLowerCase().includes(term),
    );
  });
}
