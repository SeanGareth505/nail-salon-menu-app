import { BrandingTokens } from '../models';

export const BRANDING_DEFAULTS: BrandingTokens = {
  id: 'default',
  primary: '#98576d',
  secondary: '#c08b92',
  accent: '#b78b70',
  background: '#fcf7f4',
  surface: '#fffdfb',
  text: '#45373d',
  logoUrl: null,
  markInitial: 'SF',
};

export function resolveBranding(saved: BrandingTokens): BrandingTokens {
  const legacy = {
    primary: ['#4a6b57', '#713d4f'],
    secondary: ['#8baa8e', '#9e6b7d'],
    accent: ['#c9a96e', '#ab775a'],
    background: ['#e9e6e0', '#f6f5f4'],
    surface: ['#fffdf9', '#ffffff'],
    text: ['#333333', '#29262b'],
  };
  const resolved = { ...BRANDING_DEFAULTS, ...saved };
  for (const key of ['primary', 'secondary', 'accent', 'background', 'surface', 'text'] as const) {
    if (legacy[key].includes(resolved[key]?.toLowerCase())) resolved[key] = BRANDING_DEFAULTS[key];
  }
  return resolved;
}
