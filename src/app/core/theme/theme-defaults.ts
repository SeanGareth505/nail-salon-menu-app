import { BrandingTokens } from '../models';

export const BRANDING_DEFAULTS: BrandingTokens = {
  id: 'default', primary: '#713d4f', secondary: '#9e6b7d', accent: '#ab775a',
  background: '#f6f5f4', surface: '#ffffff', text: '#29262b', logoUrl: null, markInitial: 'SF',
};

export function resolveBranding(saved: BrandingTokens): BrandingTokens {
  const legacy: Partial<BrandingTokens> = { primary: '#4a6b57', secondary: '#8baa8e', accent: '#c9a96e', background: '#e9e6e0', surface: '#fffdf9', text: '#333333' };
  const resolved = { ...BRANDING_DEFAULTS, ...saved };
  for (const key of ['primary', 'secondary', 'accent', 'background', 'surface', 'text'] as const) {
    if (resolved[key]?.toLowerCase() === legacy[key]) resolved[key] = BRANDING_DEFAULTS[key];
  }
  return resolved;
}
