import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClientsService } from '../../../core/services/clients.service';
import { Client } from '../../../core/models';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfStatePill, PillTone } from '../../../shared/components/state-pill/state-pill';
import { SfEmptyState } from '../../../shared/components/empty-state/empty-state';

const AVATAR_PALETTES = [
  { bg: '#F7E9E3', fg: '#8A5A5A' },
  { bg: '#FDF3E7', fg: '#8A6A2E' },
  { bg: '#F0F4F0', fg: '#4A6B57' },
];

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, RouterLink, SfIcon, SfStatePill, SfEmptyState],
  templateUrl: './clients.html',
  styleUrl: './clients.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class Clients {
  private readonly clientsSvc = inject(ClientsService);
  private readonly datePipe = inject(DatePipe);

  readonly search = signal('');
  readonly clients = toSignal(this.clientsSvc.listAll(), { initialValue: [] });

  readonly filteredClients = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.clients();
    return this.clients().filter(
      (c) =>
        c.fullName.toLowerCase().includes(term) ||
        c.phone.replace(/\s/g, '').includes(term.replace(/\s/g, '')) ||
        c.email.toLowerCase().includes(term),
    );
  });

  avatarBg(name: string): string {
    return AVATAR_PALETTES[this.paletteIndex(name)].bg;
  }

  avatarFg(name: string): string {
    return AVATAR_PALETTES[this.paletteIndex(name)].fg;
  }

  lastVisit(client: Client): string {
    if (!client.lastConsultationAt) return '—';
    return this.datePipe.transform(client.lastConsultationAt, 'd MMM y') ?? '—';
  }

  consentLabel(client: Client): string {
    if (!client.lastConsultationAt) return 'New';
    if (client.totalConsultations > 0 && this.daysSince(client.lastConsultationAt) > 45) return 'Review recommended';
    return 'Current';
  }

  consentTone(client: Client): PillTone {
    const label = this.consentLabel(client);
    if (label === 'Review recommended') return 'review';
    if (label === 'New') return 'neutral';
    return 'complete';
  }

  private daysSince(iso: string): number {
    const ms = Date.now() - new Date(iso).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  private paletteIndex(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_PALETTES.length;
    return hash;
  }
}
