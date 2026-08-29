import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { ConsentSubmissionsService } from '../../../core/services/consent-submissions.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AuditService } from '../../../core/services/audit.service';

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './consultations.html',
  styleUrl: './consultations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Consultations {
  private readonly consultationsSvc = inject(ConsultationsService);
  private readonly submissionsSvc = inject(ConsentSubmissionsService);
  private readonly auth = inject(AuthService);
  private readonly audit = inject(AuditService);

  readonly consultations = toSignal(this.consultationsSvc.listRecent(200), { initialValue: [] });
  readonly statusFilter = signal<'all' | 'flagged' | 'incomplete' | 'complete'>('all');

  readonly filtered = computed(() => {
    const f = this.statusFilter();
    if (f === 'all') return this.consultations();
    return this.consultations().filter((c) => c.status === f);
  });

  async markReviewed(consultationId: string, submissionId: string | null): Promise<void> {
    if (!submissionId) return;
    const uid = this.auth.currentUid() ?? 'unknown';
    await this.submissionsSvc.update(submissionId, {
      status: 'complete',
      requiresTherapistReview: false,
      reviewedBy: uid,
      reviewedAt: new Date().toISOString(),
    } as any);
    await this.consultationsSvc.update(consultationId, { status: 'complete' } as any);
    await this.audit.log('review', 'consentSubmission', submissionId, 'Marked flagged consultation as reviewed');
  }
}
