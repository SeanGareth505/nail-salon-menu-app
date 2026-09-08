import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { SpecialPricingService } from '../../../core/services/special-pricing.service';
import { SfPortrait } from '../../../shared/components/portrait/portrait';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfInfoBlock } from '../../../shared/components/info-block/info-block';
import { SfSkeleton } from '../../../shared/components/skeleton-loader/skeleton-loader';
import { FormatRandPipe } from '../../../shared/pipes/format-rand.pipe';
import { fadeSlide } from '../../../shared/animations/motion.animations';

@Component({
  selector: 'app-treatment-detail',
  standalone: true,
  imports: [RouterLink, SfIcon, SfInfoBlock, SfSkeleton, FormatRandPipe, SfPortrait],
  templateUrl: './treatment-detail.html',
  styleUrl: './treatment-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeSlide],
})
export class TreatmentDetail {
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly pricingSvc = inject(SpecialPricingService);
  private readonly location = inject(Location);

  readonly id = input<string>('');
  readonly failedImage = signal<string | null | undefined>(undefined);
  readonly hasImage = computed(
    () => !!this.treatment()?.imageUrl && this.failedImage() !== this.treatment()?.imageUrl,
  );

  readonly treatmentState = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.treatmentsSvc.get(id).pipe(
          map((treatment) => ({ treatment, loading: false, error: false })),
          startWith({ treatment: undefined, loading: true, error: false }),
          catchError(() => of({ treatment: undefined, loading: false, error: true })),
        ),
      ),
    ),
    { initialValue: { treatment: undefined, loading: true, error: false } },
  );
  readonly treatment = computed(() => this.treatmentState().treatment);
  readonly loading = computed(() => this.treatmentState().loading);
  readonly loadError = computed(() => this.treatmentState().error);

  private readonly allTherapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });
  private readonly allTreatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });

  readonly specialView = computed(() => {
    const t = this.treatment();
    return t ? this.pricingSvc.getTreatmentView(t.id) : null;
  });

  readonly performedBy = computed(() => {
    const t = this.treatment();
    if (!t?.performedByTherapistIds?.length) return [];
    const therapists = this.allTherapists();
    return t.performedByTherapistIds
      .map((id) => therapists.find((th) => th.id === id))
      .filter((th): th is NonNullable<typeof th> => !!th)
      .slice(0, 2);
  });

  readonly related = computed(() => {
    const t = this.treatment();
    if (!t) return [];
    return this.allTreatments()
      .filter((x) => t.relatedTreatmentIds?.includes(x.id))
      .slice(0, 4);
  });

  relatedTint(treatment: { categoryName?: string }): 'blush' | 'sage' | 'sky' | 'sand' {
    const name = treatment.categoryName?.toLowerCase() ?? '';
    if (name.includes('massage') || name.includes('wax')) return 'sky';
    if (name.includes('facial') || name.includes('skin')) return 'sage';
    if (name.includes('brow') || name.includes('lash') || name.includes('nail')) return 'blush';
    return 'sand';
  }

  relatedIcon(treatment: { categoryName?: string }): string {
    const name = treatment.categoryName?.toLowerCase() ?? '';
    if (name.includes('facial') || name.includes('skin') || name.includes('brow')) return 'leaf';
    return 'droplet';
  }

  readonly heroTint = computed(() => {
    const name = this.treatment()?.categoryName?.toLowerCase() ?? '';
    if (name.includes('massage') || name.includes('wax')) return 'sky';
    if (name.includes('facial') || name.includes('skin')) return 'sage';
    if (name.includes('brow') || name.includes('lash') || name.includes('nail')) return 'blush';
    return 'sand';
  });

  readonly heroIcon = computed(() => {
    const name = this.treatment()?.categoryName?.toLowerCase() ?? '';
    if (name.includes('facial') || name.includes('skin') || name.includes('brow')) return 'leaf';
    return 'droplet';
  });

  back(): void {
    this.location.back();
  }
}
