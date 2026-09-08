import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap, tap } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ClientsService } from '../../../core/services/clients.service';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { ConsentSubmissionsService } from '../../../core/services/consent-submissions.service';
import { Client, Consultation, ConsultationStatus } from '../../../core/models';
import { SfStatePill } from '../state-pill/state-pill';
import { SfEmptyState } from '../empty-state/empty-state';
import { SfSkeleton } from '../skeleton-loader/skeleton-loader';

export type ClientProfileArea = 'admin' | 'therapist';

const AVATAR_PALETTES = [
  { bg: '#F7E9E3', fg: '#8A5A5A' },
  { bg: '#FDF3E7', fg: '#8A6A2E' },
  { bg: '#F0F4F0', fg: '#4A6B57' },
];

interface DeclaredItem {
  what: string;
  when: string;
  bg: string;
  dot: string;
}

interface BackNav {
  link: string[];
  queryParams: Record<string, string> | null;
  label: string;
}

@Component({
  selector: 'sf-client-profile',
  standalone: true,
  imports: [RouterLink, DatePipe, SfStatePill, SfEmptyState, SfSkeleton],
  providers: [DatePipe],
  templateUrl: './client-profile.html',
  styleUrl: './client-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SfClientProfile {
  private readonly clientsSvc = inject(ClientsService);
  private readonly consultationsSvc = inject(ConsultationsService);
  private readonly submissionsSvc = inject(ConsentSubmissionsService);
  private readonly datePipe = inject(DatePipe);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly id = input.required<string>();
  readonly area = input<ClientProfileArea>('therapist');

  readonly isAdminView = computed(() => this.area() === 'admin');
  readonly backNav = computed((): BackNav => {
    if (this.isAdminView()) {
      return { link: ['/admin/clients'], queryParams: null, label: '← Back' };
    }

    const ret = this.route.snapshot.queryParamMap.get('return');
    switch (ret) {
      case 'consent-forms':
        return { link: ['/therapist/consent-forms'], queryParams: null, label: '← Consent forms' };
      case 'consent-forms-history':
        return { link: ['/therapist/consent-forms'], queryParams: { view: 'history' }, label: '← Consent forms' };
      default:
        return { link: ['/therapist/clients'], queryParams: null, label: '← Clients' };
    }
  });

  readonly clientLoading = signal(true);

  readonly client = toSignal(
    toObservable(this.id).pipe(
      switchMap((clientId) => {
        if (!clientId) {
          this.clientLoading.set(false);
          return of(undefined);
        }
        this.clientLoading.set(true);
        return this.clientsSvc.get(clientId).pipe(tap(() => this.clientLoading.set(false)));
      }),
    ),
    { initialValue: undefined as Client | undefined },
  );

  readonly consultations = toSignal(
    toObservable(this.id).pipe(switchMap((clientId) => (clientId ? this.consultationsSvc.listForClient(clientId) : []))),
    { initialValue: [] },
  );

  readonly submissions = toSignal(
    toObservable(this.id).pipe(switchMap((clientId) => (clientId ? this.submissionsSvc.listForClient(clientId) : []))),
    { initialValue: [] },
  );

  readonly lastSignedVersion = computed(() => {
    const latest = this.submissions()[0];
    return latest?.templateVersionNumber ?? 2;
  });

  readonly currentPublishedVersion = computed(() => (this.lastSignedVersion() ?? 2) + 1);

  readonly submissionByConsultationId = computed(
    () => new Map(this.submissions().map((submission) => [submission.consultationId, submission])),
  );

  avatarBg(name: string): string {
    return AVATAR_PALETTES[this.paletteIndex(name)].bg;
  }

  avatarFg(name: string): string {
    return AVATAR_PALETTES[this.paletteIndex(name)].fg;
  }

  clientSince(client: Client): string | null {
    if (!client.createdAt) return null;
    const date = this.formatWhen(client.createdAt);
    return date ? this.datePipe.transform(date, 'MMM y') : null;
  }

  showReviewBanner(client: Client): boolean {
    if (!client.lastConsultationAt) return false;
    const days = Math.floor((Date.now() - new Date(client.lastConsultationAt).getTime()) / (1000 * 60 * 60 * 24));
    return days > 45;
  }

  declaredItems(client: Client): DeclaredItem[] {
    const items: DeclaredItem[] = [];
    const answers = client.lastKnownAnswers ?? {};
    if (answers['meds'] === 'Yes') {
      items.push({ what: 'Taking medication', when: `Declared ${this.lastDeclared(client)}`, bg: '#FDF3E7', dot: '#C9A96E' });
    }
    if (answers['retinol'] === 'Yes') {
      items.push({ what: 'Retinoid use', when: `Declared ${this.lastDeclared(client)} — reviewed`, bg: '#FDF3E7', dot: '#C9A96E' });
    }
    if (answers['allergies'] === 'No') {
      items.push({ what: 'No known allergies', when: `Confirmed ${this.lastDeclared(client)}`, bg: '#F0F4F0', dot: '#8BAA8E' });
    }
    if (answers['pregnant'] === 'No') {
      items.push({ what: 'Not pregnant or breastfeeding', when: `Confirmed ${this.lastDeclared(client)}`, bg: '#F0F4F0', dot: '#8BAA8E' });
    }
    if (!items.length && client.lastConsultationAt) {
      items.push({ what: 'Health details on file', when: `Updated ${this.lastDeclared(client)}`, bg: '#F0F4F0', dot: '#8BAA8E' });
    }
    return items;
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

  pillTone(status: string): 'complete' | 'flagged' | 'incomplete' | 'neutral' {
    if (status === 'complete') return 'complete';
    if (status === 'pending' || status === 'incomplete' || status === 'in_progress' || status === 'flagged') return 'incomplete';
    return 'neutral';
  }

  consultationFormVersion(con: Consultation): string {
    const submission = this.submissionByConsultationId().get(con.id);
    return submission ? `v${submission.templateVersionNumber}` : 'v—';
  }

  openConsultation(con: Consultation): void {
    if (con.status === 'pending' || con.status === 'in_progress' || con.status === 'incomplete' || con.status === 'flagged') {
      void this.router.navigate(['/therapist/consent-forms', con.id, 'complete']);
      return;
    }
    void this.router.navigate(['/therapist/consent-forms'], {
      queryParams: { view: 'history', highlight: con.id },
    });
  }

  formatWhen(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate();
    }
    return null;
  }

  private lastDeclared(client: Client): string {
    const when = client.lastKnownAnswersUpdatedAt ?? client.lastConsultationAt;
    if (!when) return 'recently';
    return this.datePipe.transform(when, 'd MMM y') ?? 'recently';
  }

  private paletteIndex(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_PALETTES.length;
    return hash;
  }
}
