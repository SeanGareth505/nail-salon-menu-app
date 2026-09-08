import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CategoriesService } from '../../../core/services/categories.service';
import { SalonSettingsService } from '../../../core/services/salon-settings.service';
import { SalonIdentityService } from '../../../core/services/salon-identity.service';
import { SpecialPricingService } from '../../../core/services/special-pricing.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { PwaService } from '../../../core/pwa/pwa.service';
import { Category, SalonSettings, Special, Treatment } from '../../../core/models';
import { salonMapsUrl } from '../../../shared/utils/salon-maps.util';
import { resolveEffectiveState } from '../../../core/specials/special-pricing.util';
import { getSalonOpenStatus } from '../../../core/utils/salon-hours.util';
import { categorySfIcon } from '../../../shared/utils/category-icon.util';
import { SfPortrait } from '../../../shared/components/portrait/portrait';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfSpecialCard } from '../../../shared/components/special-card/special-card';
import { SfTreatmentCard } from '../../../shared/components/treatment-card/treatment-card';

interface HomeNavItem {
  path: string;
  label: string;
  description: string;
  icon: 'treatments' | 'specials' | 'team' | 'contact';
  tint: 'sage' | 'blush' | 'sky' | 'sand';
}

const HOME_NAV_ITEMS: HomeNavItem[] = [
  {
    path: '/treatments',
    label: 'Treatments',
    description: 'Browse our menu',
    icon: 'treatments',
    tint: 'sage',
  },
  {
    path: '/specials',
    label: 'Specials',
    description: 'Offers worth a look',
    icon: 'specials',
    tint: 'sand',
  },
  {
    path: '/therapists',
    label: 'Our team',
    description: 'Meet your therapists',
    icon: 'team',
    tint: 'blush',
  },
  {
    path: '/contact',
    label: 'Visit us',
    description: 'Hours & contact details',
    icon: 'contact',
    tint: 'sky',
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, SfIcon, SfPortrait, SfSpecialCard, SfTreatmentCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly therapistsSvc = inject(TherapistsService);
  readonly pricingSvc = inject(SpecialPricingService);
  private readonly settingsSvc = inject(SalonSettingsService);
  readonly identity = inject(SalonIdentityService);
  readonly pwa = inject(PwaService);

  readonly navItems = HOME_NAV_ITEMS;

  readonly categories = toSignal(this.categoriesSvc.listActive(), {
    initialValue: [] as Category[],
  });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), {
    initialValue: [] as Treatment[],
  });
  readonly therapists = toSignal(this.therapistsSvc.listActive(), { initialValue: [] });
  readonly settings = toSignal(this.settingsSvc.get(), {
    initialValue: undefined as SalonSettings | undefined,
  });
  readonly openStatusLabel = computed(() => getSalonOpenStatus(this.settings()?.hours));

  readonly categoriesWithCount = computed(() => {
    const items = this.treatments();
    return this.categories().map((category) => ({
      category,
      count: items.filter((t) => t.categoryId === category.id).length,
      icon: categorySfIcon(category.slug, category.icon),
    }));
  });

  readonly weekSpecial = computed<Special | null>(() => {
    const featured = this.pricingSvc.featuredSpecial();
    if (featured) return featured;
    const live = this.pricingSvc.publicSpecials().find((s) => resolveEffectiveState(s) === 'live');
    return live ?? this.pricingSvc.publicSpecials()[0] ?? null;
  });

  readonly featuredTreatments = computed(() => {
    const featured = this.treatments().filter((t) => t.featured);
    const source = featured.length ? featured : this.treatments();
    return [...source].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 3);
  });

  categoryLink(slug: string): string[] {
    return ['/treatments'];
  }

  categoryQuery(slug: string): { category: string } {
    return { category: slug };
  }

  categoryFor(treatment: Treatment): Category | undefined {
    return this.categories().find((c) => c.id === treatment.categoryId);
  }

  cardTint(treatment: Treatment): 'blush' | 'sage' | 'sky' | 'sand' {
    return this.categoryFor(treatment)?.tint ?? 'blush';
  }

  cardIcon(treatment: Treatment): string {
    const cat = this.categoryFor(treatment);
    return categorySfIcon(cat?.slug ?? '', cat?.icon ?? '');
  }

  therapistNamesFor(special: Special): string[] {
    return special.therapistIds
      .map((id) => this.therapists().find((t) => t.id === id)?.name)
      .filter((v): v is string => !!v);
  }

  treatmentNamesFor(special: Special): string[] {
    return special.treatmentIds
      .map((id) => this.treatments().find((t) => t.id === id)?.name)
      .filter((v): v is string => !!v);
  }

  effectiveStateFor(special: Special) {
    return resolveEffectiveState(special);
  }

  specialViewFor(treatmentId: string) {
    return this.pricingSvc.getTreatmentView(treatmentId);
  }

  therapistFirstName(name: string): string {
    return name.split(' ')[0] ?? name;
  }

  mapsUrl(s: SalonSettings): string {
    return salonMapsUrl(s);
  }

  install(): void {
    void this.pwa.promptInstall();
  }
}
