import { BrandingTokens } from '../models';

/** "Plum & Gold" — see projects/shared/styles/_tokens.scss. */
export const BRANDING_DEFAULTS: BrandingTokens = {
  id: 'default',
  primary: '#5b2b45',
  secondary: '#7c9a8e',
  accent: '#c08a4a',
  background: '#faf5f2',
  surface: '#ffffff',
  text: '#2a1f26',
  logoUrl: null,
  markInitial: 'SF',
};

/**
 * Colours from every palette we have shipped before. A salon's branding doc is
 * written once at seed time and then rarely touched, so a saved value that is
 * simply an older default would otherwise pin that salon to a retired palette
 * forever. Anything in this list is treated as "never deliberately chosen" and
 * falls back to the current default; a colour the salon actually picked is
 * left alone.
 */
const RETIRED_DEFAULTS = {
  primary: [
    '#98576d',
    '#713d4f',
    '#4a6b57',
    '#3e5a4a',
    '#6f8f7a',
    '#587463',
    '#3f6b55',
    '#2f5543',
    '#2f5f6a',
    '#234851',
    '#2b2426',
    '#171213',
  ],
  secondary: ['#c08b92', '#9e6b7d', '#8baa8e', '#a3b9ab', '#7fa891', '#7fa3ad', '#a08c7d'],
  accent: ['#b78b70', '#ab775a', '#c9a96e', '#c2a888', '#d4a574', '#c97b6e', '#b08968'],
  background: [
    '#fcf7f4',
    '#f6f5f4',
    '#e9e6e0',
    '#fff9f7',
    '#f5f6f3',
    '#eef4ef',
    '#f1f5f6',
    '#f7f3ef',
  ],
  surface: ['#fffdfb', '#fffdf9', '#fafbf9', '#fffcf7', '#fffcfa'],
  text: ['#45373d', '#29262b', '#333333', '#2e3531', '#1f2a24', '#1a282e', '#221d1e'],
};

export function resolveBranding(saved: BrandingTokens): BrandingTokens {
  const resolved = { ...BRANDING_DEFAULTS, ...saved };
  for (const key of ['primary', 'secondary', 'accent', 'background', 'surface', 'text'] as const) {
    if (RETIRED_DEFAULTS[key].includes(resolved[key]?.toLowerCase())) {
      resolved[key] = BRANDING_DEFAULTS[key];
    }
  }
  return resolved;
}
