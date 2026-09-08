import { BRANDING_DEFAULTS, resolveBranding } from './theme-defaults';

describe('resolveBranding', () => {
  it('migrates old default colors without changing identity', () => {
    const result = resolveBranding({
      ...BRANDING_DEFAULTS,
      primary: '#4A6B57',
      logoUrl: '/logo.png',
      markInitial: 'AB',
    });
    expect(result.primary).toBe(BRANDING_DEFAULTS.primary);
    expect(result.logoUrl).toBe('/logo.png');
    expect(result.markInitial).toBe('AB');
  });

  it('replaces the prior dark palette with the lighter salon palette', () => {
    const result = resolveBranding({
      ...BRANDING_DEFAULTS,
      primary: '#713D4F',
      secondary: '#9e6b7d',
      accent: '#ab775a',
      background: '#f6f5f4',
      surface: '#ffffff',
      text: '#29262b',
    });
    expect(result).toEqual(BRANDING_DEFAULTS);
  });

  it('migrates the prior sage palette to the current palette', () => {
    const result = resolveBranding({
      ...BRANDING_DEFAULTS,
      primary: '#3f6b55',
      secondary: '#7fa891',
      accent: '#d4a574',
      background: '#eef4ef',
      surface: '#fffcf7',
      text: '#1f2a24',
    });
    expect(result).toEqual(BRANDING_DEFAULTS);
  });

  it('migrates the prior mineral palette to the current palette', () => {
    const result = resolveBranding({
      ...BRANDING_DEFAULTS,
      primary: '#2f5f6a',
      secondary: '#7fa3ad',
      accent: '#c97b6e',
      background: '#f1f5f6',
      surface: '#ffffff',
      text: '#1a282e',
    });
    expect(result).toEqual(BRANDING_DEFAULTS);
  });

  it('migrates the prior noir palette to the current palette', () => {
    const result = resolveBranding({
      ...BRANDING_DEFAULTS,
      primary: '#2b2426',
      secondary: '#a08c7d',
      accent: '#b08968',
      background: '#f7f3ef',
      surface: '#fffcfa',
      text: '#221d1e',
    });
    expect(result).toEqual(BRANDING_DEFAULTS);
  });

  it('keeps primary button text readable against the default primary', () => {
    const channels = BRANDING_DEFAULTS.primary.match(/[a-f0-9]{2}/gi)!.map((channel) => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    expect(1.05 / (luminance + 0.05)).toBeGreaterThanOrEqual(4.5);
  });

  it('preserves custom brand colors and does not mutate stored settings', () => {
    const saved = { ...BRANDING_DEFAULTS, primary: '#123456', background: '#FAFAFE' };
    const result = resolveBranding(saved);
    expect(result.primary).toBe('#123456');
    expect(result.background).toBe('#FAFAFE');
    expect(saved).toEqual({ ...BRANDING_DEFAULTS, primary: '#123456', background: '#FAFAFE' });
    expect(result).not.toBe(saved);
  });
});
