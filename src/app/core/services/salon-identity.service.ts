import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BrandingService } from './branding.service';
import { SalonSettingsService } from './salon-settings.service';

export const DEFAULT_SALON_NAME = 'SalonFlow';
export const DEFAULT_SALON_TAGLINE = 'Your Escape, Our Passion.';
export const DEFAULT_SALON_SUBTEXT = 'Beauty · Wellness · Confidence';
export const DEFAULT_SALON_CITY = 'Rosebank';
export const DEFAULT_MARK_INITIAL = 'SF';

@Injectable({ providedIn: 'root' })
export class SalonIdentityService {
  private readonly settingsSvc = inject(SalonSettingsService);
  private readonly brandingSvc = inject(BrandingService);

  private readonly settings = toSignal(this.settingsSvc.get(), { initialValue: undefined });
  private readonly branding = toSignal(this.brandingSvc.get(), { initialValue: undefined });

  readonly name = computed(() => this.settings()?.name?.trim() || DEFAULT_SALON_NAME);
  readonly tagline = computed(() => this.settings()?.tagline?.trim() || DEFAULT_SALON_TAGLINE);
  readonly subtext = computed(() => this.settings()?.subtext?.trim() || DEFAULT_SALON_SUBTEXT);
  readonly city = computed(() => this.settings()?.city?.trim() || DEFAULT_SALON_CITY);
  readonly logoUrl = computed(() => this.branding()?.logoUrl ?? '/assets/salonflow-logo.png');
  readonly markInitial = computed(() => this.branding()?.markInitial?.trim().slice(0, 2).toUpperCase() || DEFAULT_MARK_INITIAL);
  readonly wordmarkUpper = computed(() => this.name().toUpperCase());
}
