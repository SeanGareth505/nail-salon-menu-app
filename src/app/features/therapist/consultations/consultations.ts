import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { ConsentSubmissionsService } from '../../../core/services/consent-submissions.service';
import { ConsentTemplatesService } from '../../../core/services/consent-templates.service';
import { ConsentTemplateVersionsService } from '../../../core/services/consent-template-versions.service';
import { ClientsService } from '../../../core/services/clients.service';
import { isFieldVisible } from '../../../core/consent/condition-evaluator';
import { Client, ConsentField, ConsentSubmission, ConsentTemplateVersion, Consultation, ConsultationStatus } from '../../../core/models';
import { SfStatePill } from '../../../shared/components/state-pill/state-pill';
import { SfEmptyState } from '../../../shared/components/empty-state/empty-state';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfSkeleton } from '../../../shared/components/skeleton-loader/skeleton-loader';
import {
  ConsentFormCompleteDialogResult,
  SfConsentFormCompleteDialog,
} from '../../../shared/components/consent-form-complete-dialog/consent-form-complete-dialog';
import { consultationTreatmentLabel } from '../../../core/utils/consultation-treatment.util';
import { expandCollapse } from '../../../shared/animations/motion.animations';

const AVATAR_PALETTES = [
  { bg: '#F7E9E3', fg: '#8A5A5A' },
  { bg: '#FDF3E7', fg: '#8A6A2E' },
  { bg: '#F0F4F0', fg: '#4A6B57' },
];

const FILTERS = ['Pending', 'History'] as const;
type RecordFilter = (typeof FILTERS)[number];

const CONSENT_COMMENTS_KEY = 'consent_notes';
const SKIPPED_STEP_KEYS = new Set(['details', 'consent_notes']);

interface ReviewRow {
  label: string;
  value: string;
  flagged: boolean;
}

interface ReviewGroup {
  key: string;
  name: string;
  rows: ReviewRow[];
}

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [RouterLink, DatePipe, NgTemplateOutlet, SfStatePill, SfEmptyState, SfIcon, SfSkeleton],
  templateUrl: './consultations.html',
  styleUrl: './consultations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [expandCollapse],
})
export class Consultations {
  private readonly consultationsSvc = inject(ConsultationsService);
  private readonly submissionsSvc = inject(ConsentSubmissionsService);
  private readonly templatesSvc = inject(ConsentTemplatesService);
  private readonly versionsSvc = inject(ConsentTemplateVersionsService);
  private readonly clientsSvc = inject(ClientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);

  private completeDialogRef: DialogRef<ConsentFormCompleteDialogResult, SfConsentFormCompleteDialog> | null = null;

  readonly filters = FILTERS;
  readonly statusFilter = signal<RecordFilter>('Pending');
  readonly highlightId = signal<string | null>(null);
  readonly completeModalId = signal<string | null>(null);
  readonly expandedId = signal<string | null>(null);
  readonly clientCache = signal<Record<string, Client>>({});
  readonly submissionCache = signal<Record<string, ConsentSubmission>>({});
  readonly versionCache = signal<Record<string, ConsentTemplateVersion>>({});
  private readonly initialSelectionDone = signal(false);

  readonly pendingRecords = toSignal(this.consultationsSvc.listPending(50), { initialValue: [] });
  readonly historyRecords = toSignal(this.consultationsSvc.listHistory(50), { initialValue: [] });
  readonly submissions = toSignal(this.submissionsSvc.listRecent(100), { initialValue: [] });
  readonly templates = toSignal(this.templatesSvc.listAll(), { initialValue: [] });

  readonly submissionById = computed(() => new Map(this.submissions().map((submission) => [submission.id, submission])));
  readonly templateById = computed(() => new Map(this.templates().map((template) => [template.id, template])));

  readonly filteredRecords = computed(() =>
    this.statusFilter() === 'Pending' ? this.pendingRecords() : this.historyRecords(),
  );

  readonly completeModalRecord = computed(() => {
    const id = this.completeModalId();
    if (!id) return null;
    return this.pendingRecords().find((record) => record.id === id) ?? null;
  });

  readonly selectedRecord = computed(() => {
    const id = this.expandedId();
    if (!id) return null;
    return this.filteredRecords().find((record) => record.id === id) ?? null;
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.statusFilter.set(params.get('view') === 'history' ? 'History' : 'Pending');
      const highlight = params.get('highlight');
      const complete = params.get('complete');
      this.highlightId.set(highlight);
      if (!complete) {
        this.completeModalId.set(null);
      } else if (complete === '1' && highlight) {
        this.completeModalId.set(highlight);
      } else if (complete !== '1') {
        this.completeModalId.set(complete);
      } else {
        this.completeModalId.set(null);
      }
    });

    effect(() => {
      const highlight = this.highlightId();
      const records = this.filteredRecords();

      if (highlight) {
        this.expandedId.set(highlight);
        const record = [...this.pendingRecords(), ...this.historyRecords()].find((item) => item.id === highlight);
        if (record) this.loadRecordDetails(record);
        this.initialSelectionDone.set(true);
        return;
      }

      const expanded = this.expandedId();
      if (expanded && records.some((record) => record.id === expanded)) {
        return;
      }

      if (!this.initialSelectionDone() && records.length > 0) {
        this.expandedId.set(records[0].id);
        this.loadRecordDetails(records[0]);
        this.initialSelectionDone.set(true);
        return;
      }

      const next = records[0] ?? null;
      this.expandedId.set(next?.id ?? null);
      if (next) this.loadRecordDetails(next);
    });

    effect((onCleanup) => {
      const record = this.completeModalRecord();

      if (!record) {
        if (this.completeDialogRef) {
          this.completeDialogRef.close();
          this.completeDialogRef = null;
        }
        return;
      }

      if (this.completeDialogRef) {
        return;
      }

      this.completeDialogRef = this.dialog.open(SfConsentFormCompleteDialog, {
        data: {
          consultationId: record.id,
          clientName: record.clientName,
          intendedTherapistId: record.intendedTherapistId,
        },
        panelClass: 'sf-consent-complete-dialog-panel',
        backdropClass: 'sf-consent-complete-dialog-backdrop',
        maxWidth: '680px',
        width: '100%',
      });

      const dialogRef = this.completeDialogRef;
      const sub = dialogRef.closed.subscribe((result) => {
        this.completeDialogRef = null;
        if (this.completeModalId() === record.id) {
          this.closeCompleteModal();
        }
        if (result === 'completed') {
          this.onRecordCompleted(record.id);
        }
      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  setFilter(filter: RecordFilter): void {
    this.statusFilter.set(filter);
    this.expandedId.set(null);
    this.initialSelectionDone.set(false);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        view: filter === 'History' ? 'history' : null,
        highlight: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  toggleExpanded(record: Consultation): void {
    const next = this.expandedId() === record.id ? null : record.id;
    this.expandedId.set(next);
    if (next) this.loadRecordDetails(record);
  }

  isExpanded(id: string): boolean {
    return this.expandedId() === id;
  }

  isHighlighted(id: string): boolean {
    return this.highlightId() === id;
  }

  viewClientQueryParams(): { return: string } {
    return {
      return: this.statusFilter() === 'History' ? 'consent-forms-history' : 'consent-forms',
    };
  }

  submissionFor(record: Consultation): ConsentSubmission | null {
    const id = record.consentSubmissionId;
    if (!id) return null;
    return this.submissionCache()[id] ?? this.submissionById().get(id) ?? null;
  }

  clientFor(record: Consultation): Client | undefined {
    return this.clientCache()[record.clientId];
  }

  isRecordActive(record: Consultation): boolean {
    return this.selectedRecord()?.id === record.id;
  }

  detailsLoading(record: Consultation): boolean {
    if (!this.isRecordActive(record)) return false;
    if (!this.clientCache()[record.clientId]) return true;
    if (!record.consentSubmissionId) return false;
    const submission = this.submissionFor(record);
    if (!submission) return true;
    return !!submission.templateVersionId && !this.versionCache()[submission.templateVersionId];
  }

  answerCount(record: Consultation): number {
    return this.submissionFor(record)?.answers.length ?? 0;
  }

  flaggedCount(record: Consultation): number {
    return this.submissionFor(record)?.answers.filter((answer) => answer.flagged).length ?? 0;
  }

  reviewGroupsFor(record: Consultation): ReviewGroup[] {
    const submission = this.submissionFor(record);
    const version = submission ? this.versionCache()[submission.templateVersionId] : undefined;
    if (!submission || !version) return [];

    const answers = Object.fromEntries(submission.answers.map((answer) => [answer.fieldKey, answer.value]));
    const flagged = new Map(submission.answers.map((answer) => [answer.fieldKey, !!answer.flagged]));

    return version.steps
      .filter((step) => !SKIPPED_STEP_KEYS.has(step.key))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((step) => ({
        key: step.key,
        name: step.title,
        rows: version.fields
          .filter((field) => field.step === step.key)
          .filter((field) => !['information', 'warning', 'signature', 'image'].includes(field.type))
          .filter((field) => field.key !== CONSENT_COMMENTS_KEY)
          .filter((field) => isFieldVisible(field, answers))
          .filter((field) => this.hasValue(answers[field.key]))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((field) => ({
            label: field.label,
            value: this.formatReviewValue(field, answers[field.key]),
            flagged: flagged.get(field.key) ?? false,
          })),
      }))
      .filter((group) => group.rows.length > 0);
  }

  avatarBg(name: string): string {
    return AVATAR_PALETTES[this.paletteIndex(name)].bg;
  }

  avatarFg(name: string): string {
    return AVATAR_PALETTES[this.paletteIndex(name)].fg;
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

  therapistLabel(record: Consultation): string {
    return record.performingTherapistName ?? record.intendedTherapistName ?? record.therapistName ?? 'Not recorded';
  }

  treatmentLabel(record: Consultation): string {
    return consultationTreatmentLabel(record);
  }

  openCompleteModal(record: Consultation): void {
    this.completeModalId.set(record.id);
    this.expandedId.set(record.id);
    this.loadRecordDetails(record);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { highlight: record.id, complete: record.id },
      queryParamsHandling: 'merge',
    });
  }

  closeCompleteModal(): void {
    this.completeModalId.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { complete: null },
      queryParamsHandling: 'merge',
    });
  }

  onRecordCompleted(recordId: string): void {
    if (this.expandedId() === recordId) {
      const next = this.filteredRecords().find((record) => record.id !== recordId);
      this.expandedId.set(next?.id ?? null);
      if (next) this.loadRecordDetails(next);
    }
    if (this.highlightId() === recordId) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { highlight: null },
        queryParamsHandling: 'merge',
      });
    }
  }

  whenLabel(record: Consultation): string {
    const iso = record.status === 'complete' ? record.completedAt ?? record.signedAt : record.signedAt ?? record.startedAt;
    if (!iso) return '—';
    return iso;
  }

  versionLabel(record: Consultation): string {
    const submission = this.submissionFor(record);
    if (submission) {
      const template = this.templateById().get(submission.templateId);
      const formName = template ? this.shortFormName(template.name) : 'Consent form';
      return `${formName} v${submission.templateVersionNumber}`;
    }
    return 'Consent form v1';
  }

  recordSummary(record: Consultation): string {
    const parts = [this.versionLabel(record), this.therapistLabel(record)];
    const flagged = this.flaggedCount(record);
    if (flagged > 0) parts.push(`${flagged} flagged`);
    return parts.join(' · ');
  }

  private loadRecordDetails(record: Consultation): void {
    if (!this.clientCache()[record.clientId]) {
      this.clientsSvc.get(record.clientId).subscribe((client) => {
        if (client) {
          this.clientCache.update((cache) => ({ ...cache, [record.clientId]: client }));
        }
      });
    }

    const submissionId = record.consentSubmissionId;
    if (submissionId && !this.submissionFor(record)) {
      this.submissionsSvc.get(submissionId).subscribe((submission) => {
        if (submission) {
          this.submissionCache.update((cache) => ({ ...cache, [submissionId]: submission }));
          this.loadTemplateVersion(submission.templateVersionId);
        }
      });
      return;
    }

    const submission = this.submissionFor(record);
    if (submission?.templateVersionId) {
      this.loadTemplateVersion(submission.templateVersionId);
    }
  }

  private loadTemplateVersion(versionId: string): void {
    if (this.versionCache()[versionId]) return;
    this.versionsSvc.get(versionId).subscribe((version) => {
      if (version) {
        this.versionCache.update((cache) => ({ ...cache, [versionId]: version }));
      }
    });
  }

  private shortFormName(name: string): string {
    const emDash = name.indexOf(' — ');
    if (emDash > 0) return name.slice(0, emDash).trim();
    const hyphen = name.indexOf(' - ');
    if (hyphen > 0) return name.slice(0, hyphen).trim();
    return name.split(' ')[0];
  }

  private formatReviewValue(field: ConsentField, value: unknown): string {
    if (Array.isArray(value)) return value.join(', ');
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  }

  private hasValue(value: unknown): boolean {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  private paletteIndex(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_PALETTES.length;
    return hash;
  }
}
