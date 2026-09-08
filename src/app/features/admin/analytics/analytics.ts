import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { SfStatTile } from '../../../shared/components/stat-tile/stat-tile';
import { SfPageActionDirective } from '../../../shared/directives/page-action.directive';
import { consultationTreatmentNames } from '../../../core/utils/consultation-treatment.util';
import { downloadCsv } from '../../../shared/utils/csv-export.util';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [SfStatTile, SfPageActionDirective],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Analytics {
  private readonly consultationsSvc = inject(ConsultationsService);
  private readonly treatmentsSvc = inject(TreatmentsService);

  readonly pageAction = (): void => this.export();

  readonly consultations = toSignal(this.consultationsSvc.listRecent(500), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });

  readonly completionRate = computed(() => {
    const total = this.consultations().length;
    if (!total) return '0%';
    const complete = this.consultations().filter((c) => c.status === 'complete').length;
    return Math.round((complete / total) * 100) + '%';
  });

  readonly uniqueClients = computed(() => new Set(this.consultations().map((c) => c.clientId)).size);

  readonly byTreatment = computed(() => {
    const counts = new Map<string, number>();
    for (const c of this.consultations()) {
      if (c.status !== 'complete') continue;
      const names = consultationTreatmentNames(c);
      for (const name of names) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    const rows = Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
    rows.sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...rows.map((r) => r.count));
    return rows.slice(0, 8).map((r) => ({ ...r, pct: Math.round((r.count / max) * 100) }));
  });

  export(): void {
    downloadCsv(
      'analytics.csv',
      ['Treatment', 'Consent forms', 'Share %'],
      this.byTreatment().map((r) => [r.name, String(r.count), String(r.pct)]),
    );
  }
}
