import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed } from '@angular/core';
import { CategoriesService } from '../../../core/services/categories.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { SpecialsService } from '../../../core/services/specials.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { SalonSettingsService } from '../../../core/services/salon-settings.service';
import { SalonIdentityService } from '../../../core/services/salon-identity.service';
import { getSalonOpenStatus } from '../../../core/utils/salon-hours.util';
import { SfCategoryTile } from '../../../shared/components/category-tile/category-tile';
import { SfTreatmentCard } from '../../../shared/components/treatment-card/treatment-card';
import { SfSpecialCard } from '../../../shared/components/special-card/special-card';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfEmptyStateAnimation } from '../../../shared/components/empty-state-animation/empty-state-animation';
import { SfRevealDirective } from '../../../shared/directives/reveal';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, SfCategoryTile, SfTreatmentCard, SfSpecialCard, SfIcon, SfEmptyStateAnimation, SfRevealDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly specialsSvc = inject(SpecialsService);
  private readonly therapistsSvc = inject(TherapistsService);
  private readonly settingsSvc = inject(SalonSettingsService);
  readonly identity = inject(SalonIdentityService);

  readonly settings = toSignal(this.settingsSvc.get(), { initialValue: undefined });
  readonly categories = toSignal(this.categoriesSvc.listActive(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });
  readonly therapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });
  readonly specials = toSignal(this.specialsSvc.listAll(), { initialValue: [] });

  readonly featuredTreatments = computed(() => this.treatments().slice(0, 3));
  readonly featuredTherapists = computed(() => this.therapists().slice(0, 4));
  readonly liveSpecial = computed(() => this.specials().find((s) => s.state === 'live') ?? this.specials()[0]);

  readonly openStatusLabel = computed(() => getSalonOpenStatus(this.settings()?.hours));
}
