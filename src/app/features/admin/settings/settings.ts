import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { SalonSettingsService } from '../../../core/services/salon-settings.service';
import { DemoDataService } from '../../../core/services/demo-data.service';
import { BLANK_SALON_HOURS, BLANK_SALON_SETTINGS } from '../../../core/demo/demo-catalogue.constants';
import { SalonHours, SalonSettings } from '../../../core/models';
import { SfPageActionDirective } from '../../../shared/directives/page-action.directive';
import { SfSalonMap } from '../../../shared/components/salon-map/salon-map';
import {
  DEFAULT_SALON_CITY,
  DEFAULT_SALON_NAME,
  DEFAULT_SALON_SUBTEXT,
  DEFAULT_SALON_TAGLINE,
} from '../../../core/services/salon-identity.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, SfPageActionDirective, SfSalonMap],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly settingsSvc = inject(SalonSettingsService);
  private readonly demoDataSvc = inject(DemoDataService);
  readonly pageAction = (): void => {
    void this.save();
  };
  private readonly remote = toSignal(this.settingsSvc.get(), { initialValue: undefined });

  readonly form = signal<Partial<SalonSettings>>({
    name: DEFAULT_SALON_NAME,
    tagline: DEFAULT_SALON_TAGLINE,
    subtext: DEFAULT_SALON_SUBTEXT,
    city: DEFAULT_SALON_CITY,
    hours: BLANK_SALON_HOURS,
    vatIncluded: true,
  });
  readonly saved = signal(false);
  readonly resetting = signal(false);
  readonly resetError = signal('');
  readonly isDemoCatalogue = computed(() => this.remote()?.catalogueSource === 'demo');
  private loaded = false;

  constructor() {
    effect(() => {
      const s = this.remote();
      if (s && !this.loaded) {
        this.loaded = true;
        this.form.set({ ...s, hours: s.hours?.length ? s.hours : BLANK_SALON_HOURS });
      }
    });
  }

  setField<K extends keyof SalonSettings>(key: K, value: SalonSettings[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  setMapCoordinate(key: 'mapLat' | 'mapLng', raw: string | number | null): void {
    if (raw === '' || raw === null) {
      this.setField(key, undefined);
      return;
    }

    const value = typeof raw === 'number' ? raw : Number(raw);
    this.setField(key, Number.isFinite(value) ? value : undefined);
  }

  updateHour(day: string, patch: Partial<SalonHours>): void {
    this.form.update((f) => ({
      ...f,
      hours: (f.hours ?? []).map((h) => (h.day === day ? { ...h, ...patch } : h)),
    }));
  }

  async save(): Promise<void> {
    const value = { ...this.form(), id: 'default' as const };
    await this.settingsSvc.save(value);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }

  async startFromScratch(): Promise<void> {
    const confirmed = confirm(
      'Remove all demo treatments, therapists, specials, and sample salon details? You can then add your own menu from scratch.',
    );
    if (!confirmed) return;

    this.resetError.set('');
    this.resetting.set(true);
    try {
      await this.demoDataSvc.clearDemoCatalogueAndStartFresh();
      this.loaded = false;
      this.form.set({ ...BLANK_SALON_SETTINGS });
    } catch {
      this.resetError.set('Could not clear demo data. Check your connection and try again.');
    } finally {
      this.resetting.set(false);
    }
  }
}
