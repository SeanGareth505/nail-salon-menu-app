import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfInfoBlock } from '../../../shared/components/info-block/info-block';
import { SfSkeleton } from '../../../shared/components/skeleton-loader/skeleton-loader';
import { fadeSlide } from '../../../shared/animations/motion.animations';

@Component({
  selector: 'app-treatment-detail',
  standalone: true,
  imports: [RouterLink, SfIcon, SfInfoBlock, SfSkeleton],
  templateUrl: './treatment-detail.html',
  styleUrl: './treatment-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeSlide],
})
export class TreatmentDetail {
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly location = inject(Location);

  readonly id = input<string>('');

  readonly treatment = toSignal(
    toObservable(this.id).pipe(switchMap((id) => (id ? this.treatmentsSvc.get(id) : []))),
    { initialValue: undefined },
  );

  private readonly allTherapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });
  private readonly allTreatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });

  readonly performedBy = computed(() => {
    const t = this.treatment();
    if (!t) return undefined;
    return this.allTherapists().find((th) => t.performedByTherapistIds?.includes(th.id));
  });

  readonly related = computed(() => {
    const t = this.treatment();
    if (!t) return [];
    return this.allTreatments().filter((x) => t.relatedTreatmentIds?.includes(x.id)).slice(0, 4);
  });

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
