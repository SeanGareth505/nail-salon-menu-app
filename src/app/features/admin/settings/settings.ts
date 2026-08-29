import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { SalonSettingsService } from '../../../core/services/salon-settings.service';
import { SalonHours, SalonSettings } from '../../../core/models';
import {
  DEFAULT_SALON_CITY,
  DEFAULT_SALON_NAME,
  DEFAULT_SALON_SUBTEXT,
  DEFAULT_SALON_TAGLINE,
} from '../../../core/services/salon-identity.service';

const DEFAULT_HOURS: SalonHours[] = [
  { day: 'monday', label: 'Monday – Friday', open: '09:00', close: '18:00' },
  { day: 'saturday', label: 'Saturday', open: '09:00', close: '16:00' },
  { day: 'sunday', label: 'Sunday', open: '10:00', close: '14:00' },
  { day: 'public_holiday', label: 'Public holidays', open: null, close: null, byAppointmentOnly: true },
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly settingsSvc = inject(SalonSettingsService);
  private readonly remote = toSignal(this.settingsSvc.get(), { initialValue: undefined });

  readonly form = signal<Partial<SalonSettings>>({
    name: DEFAULT_SALON_NAME,
    tagline: DEFAULT_SALON_TAGLINE,
    subtext: DEFAULT_SALON_SUBTEXT,
    city: DEFAULT_SALON_CITY,
    hours: DEFAULT_HOURS,
    vatIncluded: true,
  });
  readonly saved = signal(false);
  private loaded = false;

  constructor() {
    effect(() => {
      const s = this.remote();
      if (s && !this.loaded) {
        this.loaded = true;
        this.form.set({ ...s, hours: s.hours?.length ? s.hours : DEFAULT_HOURS });
      }
    });
  }

  setField<K extends keyof SalonSettings>(key: K, value: SalonSettings[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
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
}
