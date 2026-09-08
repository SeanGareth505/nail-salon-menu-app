import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SalonMapSettings, salonMapsEmbedUrl, salonMapsUrl } from '../../utils/salon-maps.util';

@Component({
  selector: 'sf-salon-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './salon-map.html',
  styleUrl: './salon-map.scss',
})
export class SfSalonMap {
  private readonly sanitizer = inject(DomSanitizer);

  readonly settings = input.required<Partial<SalonMapSettings>>();
  readonly title = input('Salon location map');

  readonly hasMap = computed(() => salonMapsEmbedUrl(this.settings()) !== null);
  readonly directionsUrl = computed(() => salonMapsUrl(this.settings()));
  readonly embedUrl = computed(() => {
    const url = salonMapsEmbedUrl(this.settings());
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
}
