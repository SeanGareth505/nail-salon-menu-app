import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SalonSettings, SalonHours } from '../../../core/models/salon-settings.model';
import { SalonSettingsService } from '../../../core/services/salon-settings.service';
import { SfIcon } from '../../../shared/components/icon/icon';
import { SfEmptyStateAnimation } from '../../../shared/components/empty-state-animation/empty-state-animation';
import { SfSalonMap } from '../../../shared/components/salon-map/salon-map';
import { salonAddressQuery, salonMapsUrl } from '../../../shared/utils/salon-maps.util';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [SfIcon, SfEmptyStateAnimation, SfSalonMap],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly settingsSvc = inject(SalonSettingsService);
  readonly settings = toSignal(this.settingsSvc.get(), { initialValue: undefined });

  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap);
  readonly enquiry = computed(() =>
    (
      this.params()?.get('treatment') ||
      this.params()?.get('therapist') ||
      this.params()?.get('special') ||
      ''
    ).slice(0, 160),
  );

  whatsappUrl(s: SalonSettings): string {
    const phone = s.whatsapp.replace(/[^0-9]/g, '');
    const message = this.enquiry()
      ? `Hello, I'd like to enquire about ${this.enquiry()}. Please let me know your availability.`
      : `Hello, I'd like to arrange a visit. Please let me know your availability.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  emailUrl(s: SalonSettings): string {
    return `mailto:${s.email}?subject=${encodeURIComponent(this.enquiry() ? `Enquiry: ${this.enquiry()}` : 'Appointment enquiry')}`;
  }

  mapsUrl(s: SalonSettings): string {
    return salonMapsUrl(s);
  }

  addressText(s: SalonSettings): string {
    const parts = [salonAddressQuery(s), s.locationNote?.trim()].filter(Boolean);
    if (!parts.length) {
      return '';
    }

    return `${parts.join('. ')}.`;
  }

  isWeekdayRow(h: SalonHours): boolean {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(h.day);
  }

  hoursLabel(h: SalonHours): string {
    if (h.byAppointmentOnly) return 'By appointment';
    if (!h.open || !h.close) return 'Closed';
    return `${h.open} – ${h.close}`;
  }

  isTodayRow(h: SalonHours): boolean {
    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = dayIndex[new Date().getDay()];
    if (
      h.label.toLowerCase().includes('–') &&
      h.label.toLowerCase().includes('fri') &&
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(today)
    ) {
      return true;
    }
    return h.day === today;
  }
}
