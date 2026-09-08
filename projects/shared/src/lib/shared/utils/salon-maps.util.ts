import { SalonSettings } from '../../core/models/salon-settings.model';

export type SalonMapSettings = Partial<
  Pick<SalonSettings, 'addressLine1' | 'addressLine2' | 'city' | 'mapLat' | 'mapLng'>
>;

export function salonAddressQuery(settings: SalonMapSettings): string {
  return [settings.addressLine1, settings.addressLine2, settings.city].filter(Boolean).join(', ');
}

export function hasValidMapCoordinates(settings: SalonMapSettings): boolean {
  return (
    typeof settings.mapLat === 'number' &&
    typeof settings.mapLng === 'number' &&
    Number.isFinite(settings.mapLat) &&
    Number.isFinite(settings.mapLng)
  );
}

export function salonMapsQuery(settings: SalonMapSettings): string | null {
  if (hasValidMapCoordinates(settings)) {
    return `${settings.mapLat},${settings.mapLng}`;
  }

  const address = salonAddressQuery(settings);
  return address || null;
}

export function salonMapsUrl(settings: SalonMapSettings): string {
  const query = salonMapsQuery(settings);
  if (!query) {
    return 'https://www.google.com/maps';
  }

  if (hasValidMapCoordinates(settings)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${settings.mapLat},${settings.mapLng}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function salonMapsEmbedUrl(settings: SalonMapSettings): string | null {
  const query = salonMapsQuery(settings);
  if (!query) {
    return null;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&hl=en&output=embed`;
}
