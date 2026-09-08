import {
  hasValidMapCoordinates,
  salonAddressQuery,
  salonMapsEmbedUrl,
  salonMapsUrl,
} from './salon-maps.util';

describe('salon-maps.util', () => {
  const base = {
    addressLine1: 'Shop 42, The Zone @ Rosebank',
    addressLine2: 'Oxford Road',
    city: 'Johannesburg',
  };

  it('builds an address query from salon settings', () => {
    expect(salonAddressQuery(base)).toBe('Shop 42, The Zone @ Rosebank, Oxford Road, Johannesburg');
  });

  it('prefers coordinates for map links when available', () => {
    const settings = { ...base, mapLat: -26.1456, mapLng: 28.0436 };

    expect(hasValidMapCoordinates(settings)).toBe(true);
    expect(salonMapsUrl(settings)).toBe('https://www.google.com/maps/dir/?api=1&destination=-26.1456,28.0436');
    expect(salonMapsEmbedUrl(settings)).toContain('q=-26.1456%2C28.0436');
  });

  it('falls back to the address when coordinates are missing', () => {
    expect(salonMapsUrl(base)).toContain('destination=Shop%2042');
    expect(salonMapsEmbedUrl(base)).toContain('output=embed');
  });
});
