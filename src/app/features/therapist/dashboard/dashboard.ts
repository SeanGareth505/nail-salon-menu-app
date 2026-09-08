import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { ConsultationStatus } from '../../../core/models';
import { SfStatePill } from '../../../shared/components/state-pill/state-pill';
import { SfEmptyState } from '../../../shared/components/empty-state/empty-state';

const AVATAR_PALETTES = [
  { bg: 'var(--sf-blush)', fg: 'var(--sf-blush-fg)' },
  { bg: 'var(--sf-champagne-light)', fg: 'var(--sf-champagne-ink)' },
  { bg: 'var(--sf-canvas)', fg: 'var(--sf-forest-dark)' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, SfStatePill, SfEmptyState],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly consultationsSvc = inject(ConsultationsService);

  readonly today = new Date();
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  readonly pending = toSignal(this.consultationsSvc.listPending(8), { initialValue: [] });

  avatarBg(name: string): string {
    return AVATAR_PALETTES[this.paletteIndex(name)].bg;
  }

  avatarFg(name: string): string {
    return AVATAR_PALETTES[this.paletteIndex(name)].fg;
  }

  whenLabel(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} today`;
    }
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  statusLabel(status: ConsultationStatus): string {
    switch (status) {
      case 'pending':
      case 'in_progress':
      case 'incomplete':
      case 'flagged':
        return 'Pending';
      case 'complete':
        return 'Complete';
      case 'abandoned':
        return 'Abandoned';
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  }

  pillTone(status: ConsultationStatus): 'complete' | 'flagged' | 'incomplete' | 'neutral' {
    switch (status) {
      case 'complete':
        return 'complete';
      case 'pending':
      case 'in_progress':
      case 'incomplete':
      case 'flagged':
        return 'incomplete';
      case 'abandoned':
        return 'neutral';
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  }

  private paletteIndex(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_PALETTES.length;
    return hash;
  }
}
