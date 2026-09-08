import { BrandingTokens } from '../models';

export const BRANDING_DEFAULTS: BrandingTokens = {
  id: 'default',
  primary: '#6f8f7a',
  secondary: '#a3b9ab',
  accent: '#c2a888',
  background: '#f5f6f3',
  surface: '#fafbf9',
  text: '#2e3531',
  logoUrl: null,
  markInitial: 'SF',
};

export function resolveBranding(saved: BrandingTokens): BrandingTokens {
  const legacy = {
    primary: ['#98576d', '#713d4f', '#4a6b57', '#3e5a4a'],
    secondary: ['#c08b92', '#9e6b7d', '#8baa8e'],
    accent: ['#b78b70', '#ab775a', '#c9a96e'],
    background: ['#fcf7f4', '#f6f5f4', '#e9e6e0', '#fff9f7'],
    surface: ['#fffdfb', '#ffffff', '#fffdf9'],
    text: ['#45373d', '#29262b', '#333333'],
  };
  const resolved = { ...BRANDING_DEFAULTS, ...saved };
  for (const key of ['primary', 'secondary', 'accent', 'background', 'surface', 'text'] as const) {
    if (legacy[key].includes(resolved[key]?.toLowerCase())) resolved[key] = BRANDING_DEFAULTS[key];
  }
  return resolved;
}
