export type LottieRgba = [number, number, number, number];

export interface LottieThemePalette {
  forest: LottieRgba;
  sage: LottieRgba;
  sageLight: LottieRgba;
  champagne: LottieRgba;
  champagneLight: LottieRgba;
  ivory: LottieRgba;
  ink: LottieRgba;
  inkMuted: LottieRgba;
}

export const DEFAULT_LOTTIE_PALETTE: LottieThemePalette = {
  forest: hexToLottie('#4a6b57'),
  sage: hexToLottie('#8baa8e'),
  sageLight: hexToLottie('#f0f4f0'),
  champagne: hexToLottie('#c9a96e'),
  champagneLight: hexToLottie('#f5efe7'),
  ivory: hexToLottie('#fffdf9'),
  ink: hexToLottie('#333333'),
  inkMuted: hexToLottie('#9e9e96'),
};

export function hexToLottie(hex: string): LottieRgba {
  const normalized = hex.trim().replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return [r, g, b, 1];
}

function luminance([r, g, b]: LottieRgba): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function saturation([r, g, b]: LottieRgba): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function hue([r, g, b]: LottieRgba): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

function mapColorToPalette(rgb: LottieRgba, palette: LottieThemePalette, role?: string): LottieRgba {
  if (role === 'accent') return palette.champagne;
  if (role === 'primary') return palette.forest;
  if (role === 'secondary') return palette.sage;

  const lum = luminance(rgb);
  const sat = saturation(rgb);

  if (lum > 0.94) return palette.ivory;
  if (lum < 0.22) return palette.ink;

  if (sat < 0.12) {
    return lum > 0.72 ? palette.sageLight : palette.inkMuted;
  }

  const h = hue(rgb);

  if (h >= 170 && h <= 250) return palette.sage;
  if (h >= 75 && h <= 165) return palette.forest;
  if (h >= 15 && h <= 65) return palette.champagne;
  if (h > 300 || h < 15) return palette.champagneLight;

  return palette.sage;
}

function isRgba(value: unknown): value is LottieRgba {
  return Array.isArray(value) && value.length >= 3 && value.every((v) => typeof v === 'number');
}

function recolorNode(node: unknown, palette: LottieThemePalette, role?: string): void {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    for (const item of node) recolorNode(item, palette, role);
    return;
  }

  const record = node as Record<string, unknown>;

  if (record['ty'] === 'st' || record['ty'] === 'fl') {
    const color = record['c'];
    if (color && typeof color === 'object' && !Array.isArray(color)) {
      const colorRecord = color as Record<string, unknown>;
      if (isRgba(colorRecord['k'])) {
        colorRecord['k'] = mapColorToPalette(colorRecord['k'] as LottieRgba, palette, role);
      }
    }
  }

  if (record['nm'] === 'check' || record['nm'] === 'Stroke 1' && role === 'success-check') {
    role = 'primary';
  }

  for (const value of Object.values(record)) {
    recolorNode(value, palette, role);
  }
}

export function applyLottieTheme(data: unknown, palette: LottieThemePalette): unknown {
  const clone = structuredClone(data);
  recolorNode(clone, palette);
  return clone;
}

export function applySuccessCheckTheme(data: unknown, palette: LottieThemePalette): unknown {
  const clone = structuredClone(data) as Record<string, unknown>;
  const layers = (clone['layers'] as unknown[]) ?? [];
  for (const layer of layers) {
    const l = layer as Record<string, unknown>;
    const nm = String(l['nm'] ?? '');
    const target = nm === 'check' ? palette.forest : palette.champagne;
    recolorLayerStrokes(l, target);
  }
  return clone;
}

function recolorLayerStrokes(layer: Record<string, unknown>, color: LottieRgba): void {
  const shapes = layer['shapes'] as unknown[] | undefined;
  if (!shapes) return;
  for (const shape of shapes) walkShape(shape, color);
}

function walkShape(node: unknown, color: LottieRgba): void {
  if (!node || typeof node !== 'object') return;
  const record = node as Record<string, unknown>;
  if (record['ty'] === 'st' && record['c'] && typeof record['c'] === 'object') {
    (record['c'] as Record<string, unknown>)['k'] = color;
  }
  const items = record['it'] as unknown[] | undefined;
  if (items) for (const item of items) walkShape(item, color);
}
