import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { SfStatTile } from '../../../shared/components/stat-tile/stat-tile';
import { SfStatePill } from '../../../shared/components/state-pill/state-pill';
import { SfEmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, SfStatTile, SfStatePill, SfEmptyState],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly consultationsSvc = inject(ConsultationsService);

  readonly today = new Date();
  readonly displayName = computed(() => this.auth.displayName().split(' ')[0] || 'there');

  readonly recent = toSignal(this.consultationsSvc.listRecent(8), { initialValue: [] });

  readonly todayCount = computed(() => this.recent().filter((c) => this.isToday(c.startedAt)).length);
  readonly weekCount = computed(() => this.recent().length);
  readonly needsReview = computed(() => this.recent().filter((c) => c.status === 'flagged'));
  readonly incomplete = computed(() => this.recent().filter((c) => c.status === 'incomplete'));
  readonly todaySchedule = computed(() =>
    this.recent()
      .filter((c) => this.isToday(c.startedAt))
      .slice(0, 4),
  );

  private isToday(iso: string): boolean {
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }

  pillTone(status: string): 'complete' | 'flagged' | 'incomplete' | 'neutral' {
    if (status === 'complete') return 'complete';
    if (status === 'flagged') return 'flagged';
    if (status === 'incomplete') return 'incomplete';
    return 'neutral';
  }
}
