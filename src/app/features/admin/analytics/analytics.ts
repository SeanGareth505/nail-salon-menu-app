import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { SfStatTile } from '../../../shared/components/stat-tile/stat-tile';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [SfStatTile],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Analytics {
  private readonly consultationsSvc = inject(ConsultationsService);
  private readonly treatmentsSvc = inject(TreatmentsService);

  readonly consultations = toSignal(this.consultationsSvc.listRecent(500), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });

  readonly completionRate = computed(() => {
    const total = this.consultations().length;
    if (!total) return '0%';
    const complete = this.consultations().filter((c) => c.status === 'complete').length;
    return Math.round((complete / total) * 100) + '%';
  });

  readonly flagRate = computed(() => {
    const total = this.consultations().length;
    if (!total) return '0%';
    const flagged = this.consultations().filter((c) => c.status === 'flagged').length;
    return Math.round((flagged / total) * 100) + '%';
  });

  readonly byTreatment = computed(() => {
    const counts = new Map<string, number>();
    for (const c of this.consultations()) counts.set(c.treatmentName, (counts.get(c.treatmentName) ?? 0) + 1);
    const rows = Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
    rows.sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...rows.map((r) => r.count));
    return rows.slice(0, 8).map((r) => ({ ...r, pct: Math.round((r.count / max) * 100) }));
  });
}
