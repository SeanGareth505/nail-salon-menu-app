import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ConsentSubmissionsService } from '../../../core/services/consent-submissions.service';
import { ConsentTemplateVersionsService } from '../../../core/services/consent-template-versions.service';
import { ConsentField, ConsentStepDefinition } from '../../../core/models';
import { SfIcon } from '../icon/icon';

interface CardRow {
  key: string;
  label: string;
  value: unknown;
  flagged: boolean;
  flagReason?: string;
}
interface CardGroup {
  key: string;
  title: string;
  rows: CardRow[];
}

@Component({
  selector: 'sf-consultation-card',
  standalone: true,
  imports: [DatePipe, SfIcon],
  templateUrl: './consultation-card.html',
  styleUrl: './consultation-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SfConsultationCard {
  private readonly submissionsSvc = inject(ConsentSubmissionsService);
  private readonly versionsSvc = inject(ConsentTemplateVersionsService);

  readonly submissionId = input.required<string>();

  readonly submission = toSignal(
    toObservable(this.submissionId).pipe(switchMap((id) => (id ? this.submissionsSvc.get(id) : of(undefined)))),
    { initialValue: undefined },
  );

  readonly version = toSignal(
    toObservable(this.submission).pipe(
      switchMap((s) => {
        const versionId = s?.templateVersionId;
        return versionId && versionId !== 'fallback' ? this.versionsSvc.get(versionId) : of(undefined);
      }),
    ),
    { initialValue: undefined },
  );

  readonly groups = computed<CardGroup[]>(() => {
    const sub = this.submission();
    if (!sub) return [];
    const version = this.version();

    if (!version) {
      // No template version on record (fallback form, or version lookup failed) —
      // still show the signed answers, just without step grouping/labels.
      return [
        {
          key: 'answers',
          title: 'Answers',
          rows: sub.answers.map((a) => ({
            key: a.fieldKey,
            label: this.humanize(a.fieldKey),
            value: a.value,
            flagged: !!a.flagged,
            flagReason: a.flagReason,
          })),
        },
      ];
    }

    const steps = [...version.steps].sort((a: ConsentStepDefinition, b: ConsentStepDefinition) => a.sortOrder - b.sortOrder);
    const answersByKey = new Map(sub.answers.map((a) => [a.fieldKey, a]));

    const grouped = steps
      .map((step) => {
        const rows = version.fields
          .filter((f) => f.step === step.key && !['information', 'warning'].includes(f.type))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .filter((f) => answersByKey.has(f.key))
          .map((f) => {
            const answer = answersByKey.get(f.key)!;
            return {
              key: f.key,
              label: f.label,
              value: answer.value,
              flagged: !!answer.flagged,
              flagReason: answer.flagReason,
            };
          });
        return { key: step.key, title: step.title, rows };
      })
      .filter((g) => g.rows.length > 0);

    // Any answered field whose key isn't in the current field set at all
    // (e.g. the version doc couldn't be resolved for one field) still shows.
    const knownKeys = new Set(version.fields.map((f) => f.key));
    const orphanRows = sub.answers
      .filter((a) => !knownKeys.has(a.fieldKey))
      .map((a) => ({ key: a.fieldKey, label: this.humanize(a.fieldKey), value: a.value, flagged: !!a.flagged, flagReason: a.flagReason }));

    return orphanRows.length ? [...grouped, { key: 'other', title: 'Other', rows: orphanRows }] : grouped;
  });

  formatValue(v: unknown): string {
    if (v === null || v === undefined || v === '') return '—';
    if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (v === 'yes' || v === 'no' || v === 'unsure') return (v as string).charAt(0).toUpperCase() + (v as string).slice(1);
    return String(v);
  }

  private humanize(key: string): string {
    return key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
