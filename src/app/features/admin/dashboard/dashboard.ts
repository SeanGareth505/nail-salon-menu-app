import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { ConsentSubmissionsService } from '../../../core/services/consent-submissions.service';
import { SfStatTile } from '../../../shared/components/stat-tile/stat-tile';
import { SfEmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, SfStatTile, SfEmptyState],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly consultationsSvc = inject(ConsultationsService);
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly submissionsSvc = inject(ConsentSubmissionsService);

  readonly consultations = toSignal(this.consultationsSvc.listRecent(200), { initialValue: [] });
  readonly therapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });
  readonly flagged = toSignal(this.submissionsSvc.listFlagged(), { initialValue: [] });
  readonly completeSubmissions = toSignal(this.submissionsSvc.listComplete(), { initialValue: [] });

  readonly todayCount = computed(() => this.consultations().filter((c) => this.isToday(c.startedAt)).length);
  readonly weekCount = computed(() => this.consultations().filter((c) => this.withinDays(c.startedAt, 7)).length);
  readonly monthCount = computed(() => this.consultations().filter((c) => this.withinDays(c.startedAt, 30)).length);
  readonly consentExpiring = computed(() => {
    const nineMonthsMs = 9 * 30 * 86400000;
    const cutoff = Date.now() - nineMonthsMs;
    const latestByClient = new Map<string, string>();
    for (const submission of this.completeSubmissions()) {
      const signedAt = submission.signature?.signedAt;
      if (!signedAt) continue;
      const existing = latestByClient.get(submission.clientId);
      if (!existing || signedAt > existing) latestByClient.set(submission.clientId, signedAt);
    }
    return [...latestByClient.values()].filter((signedAt) => new Date(signedAt).getTime() <= cutoff).length;
  });

  readonly weeklyBuckets = computed(() => {
    const buckets: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      const count = this.consultations().filter((c) => {
        const d = new Date(c.startedAt);
        const diffDays = Math.floor((weekStart.getTime() - d.getTime()) / 86400000);
        return diffDays >= 0 && diffDays < 7;
      }).length;
      buckets.push({ label: `W${8 - i}`, count });
    }
    const max = Math.max(1, ...buckets.map((b) => b.count));
    return buckets.map((b) => ({ ...b, pct: Math.round((b.count / max) * 100) }));
  });

  readonly therapistActivity = computed(() =>
    this.therapists().map((t) => {
      const own = this.consultations().filter((c) => c.therapistId === t.id);
      const thisMonth = own.filter((c) => this.withinDays(c.startedAt, 30)).length;
      const flaggedCount = this.flagged().filter((f) => f.therapistId === t.id).length;
      const last = own[0]?.startedAt ?? null;
      return { therapist: t, thisMonth, flaggedCount, last, avgPerWeek: Math.round((thisMonth / 4.3) * 10) / 10 };
    }),
  );

  private isToday(iso: string): boolean {
    return new Date(iso).toDateString() === new Date().toDateString();
  }
  private withinDays(iso: string, days: number): boolean {
    const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
    return diff >= 0 && diff <= days;
  }
}
