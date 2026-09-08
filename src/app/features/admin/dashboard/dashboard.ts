import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { ConsentSubmissionsService } from '../../../core/services/consent-submissions.service';
import { SfStatTile } from '../../../shared/components/stat-tile/stat-tile';
import { SfPageActionDirective } from '../../../shared/directives/page-action.directive';
import { downloadCsv } from '../../../shared/utils/csv-export.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, SfStatTile, SfPageActionDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly consultationsSvc = inject(ConsultationsService);
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly submissionsSvc = inject(ConsentSubmissionsService);

  readonly pageAction = (): void => this.exportSummary();

  readonly consultations = toSignal(this.consultationsSvc.listRecent(200), { initialValue: [] });
  readonly therapists = toSignal(this.therapistsSvc.listAll(), { initialValue: [] });
  readonly completeSubmissions = toSignal(this.submissionsSvc.listComplete(), { initialValue: [] });

  readonly activeTherapists = computed(() => this.therapists().filter((t) => t.active).length);
  readonly inactiveTherapists = computed(() => this.therapists().filter((t) => !t.active).length);

  readonly todayCount = computed(
    () => this.consultations().filter((c) => this.isToday(c.startedAt)).length,
  );
  readonly weekCount = computed(
    () => this.consultations().filter((c) => this.withinDays(c.startedAt, 7)).length,
  );
  readonly monthCount = computed(
    () => this.consultations().filter((c) => this.withinDays(c.startedAt, 30)).length,
  );
  readonly weekOverWeekHint = computed(() => this.formatWeekOverWeek());
  readonly monthTrendHint = computed(() => `${this.monthCount()} in the last 30 days`);
  readonly pendingCount = computed(
    () => this.consultations().filter((c) => c.status === 'pending').length,
  );
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
    return [...latestByClient.values()].filter((signedAt) => new Date(signedAt).getTime() <= cutoff)
      .length;
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
    const chartMax = 114;
    return buckets.map((b) => ({
      ...b,
      pct: Math.round((b.count / max) * 100),
      height: Math.round((b.count / max) * chartMax) || 4,
    }));
  });

  readonly eightWeekCount = computed(() =>
    this.weeklyBuckets().reduce((total, week) => total + week.count, 0),
  );

  readonly monthLabel = computed(() =>
    new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }),
  );

  readonly therapistActivity = computed(() =>
    this.therapists().map((t) => {
      const own = this.consultations().filter(
        (c) =>
          c.performingTherapistId === t.id ||
          c.intendedTherapistId === t.id ||
          c.therapistId === t.id,
      );
      const thisMonth = own.filter((c) => this.withinDays(c.startedAt, 30)).length;
      const last = own[0]?.startedAt ?? null;
      const pending = own.filter((c) => c.status === 'pending').length;
      return {
        therapist: t,
        thisMonth,
        last,
        avgPerWeek: Math.round((thisMonth / 4.3) * 10) / 10,
        pending,
      };
    }),
  );

  readonly pendingItems = computed(() =>
    this.consultations()
      .filter((c) => c.status === 'pending')
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        clientName: c.clientName,
        reason: 'Awaiting review',
        meta: `${c.intendedTherapistName ?? c.therapistName ?? 'Therapist TBC'} · signed ${new Date(c.signedAt ?? c.startedAt).toLocaleDateString()}`,
      })),
  );

  exportSummary(): void {
    downloadCsv(
      'dashboard-summary.csv',
      ['Metric', 'Value'],
      [
        ['Consent forms today', String(this.todayCount())],
        ['This week', String(this.weekCount())],
        ['This month', String(this.monthCount())],
        ['Active therapists', String(this.activeTherapists())],
        ['Pending completion', String(this.pendingCount())],
        ['Consent expiring', String(this.consentExpiring())],
      ],
    );
  }

  private isToday(iso: string): boolean {
    return new Date(iso).toDateString() === new Date().toDateString();
  }
  private withinDays(iso: string, days: number): boolean {
    const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
    return diff >= 0 && diff <= days;
  }

  private formatWeekOverWeek(): string {
    const thisWeek = this.weekCount();
    const lastWeek = this.consultations().filter((c) => {
      const diff = (Date.now() - new Date(c.startedAt).getTime()) / 86400000;
      return diff > 7 && diff <= 14;
    }).length;
    if (lastWeek === 0) return thisWeek > 0 ? 'First week with activity' : 'No forms yet this week';
    const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    if (pct > 0) return `+${pct}% vs last week`;
    if (pct < 0) return `${pct}% vs last week`;
    return 'Same as last week';
  }
}
