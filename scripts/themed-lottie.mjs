#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, '../public/assets/lottie');

const palette = {
  forest: hexToLottie('#5b2b45'),
  sage: hexToLottie('#7c9a8e'),
  sageLight: hexToLottie('#e3ede8'),
  champagne: hexToLottie('#c08a4a'),
  champagneLight: hexToLottie('#f8eedd'),
  ivory: hexToLottie('#ffffff'),
  ink: hexToLottie('#2a1f26'),
  inkMuted: hexToLottie('#6e5f67'),
};

function hexToLottie(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255, 1];
}

function luminance([r, g, b]) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function saturation([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function hue([r, g, b]) {
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

function mapColor(rgb) {
  const lum = luminance(rgb);
  const sat = saturation(rgb);
  if (lum > 0.94) return palette.ivory;
  if (lum < 0.22) return palette.ink;
  if (sat < 0.12) return lum > 0.72 ? palette.sageLight : palette.inkMuted;
  const h = hue(rgb);
  if (h >= 170 && h <= 250) return palette.sage;
  if (h >= 75 && h <= 165) return palette.forest;
  if (h >= 15 && h <= 65) return palette.champagne;
  if (h > 300 || h < 15) return palette.champagneLight;
  return palette.sage;
}

function applySuccessCheck(data) {
  for (const layer of data.layers ?? []) {
    const color = layer.nm === 'check' ? palette.forest : palette.champagne;
    recolorLayer(layer, color);
  }
  return data;
}

function recolorLayer(layer, color) {
  for (const shape of layer.shapes ?? []) walk(shape, color);
}

function walk(node, color) {
  if (!node || typeof node !== 'object') return;
  if (node.ty === 'st' && node.c?.k) node.c.k = color;
  for (const item of node.it ?? []) walk(item, color);
}

function recolorNode(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) recolorNode(item);
    return;
  }
  if (node.c?.k && Array.isArray(node.c.k) && node.c.k.length >= 3) {
    node.c.k = mapColor(node.c.k);
  }
  for (const value of Object.values(node)) recolorNode(value);
}

function themeFiles(targetDir, skipCategories = false) {
  if (!existsSync(targetDir)) return;
  if (skipCategories && targetDir.endsWith('categories')) return;

  for (const file of readdirSync(targetDir).filter((f) => f.endsWith('.json'))) {
    const path = join(targetDir, file);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const themed = file === 'success-check.json' ? applySuccessCheck(structuredClone(data)) : structuredClone(data);
    if (file !== 'success-check.json') recolorNode(themed);
    writeFileSync(path, JSON.stringify(themed));
    console.log('themed', join(targetDir, file));
  }
}

themeFiles(dir);
themeFiles(join(dir, 'categories'), true);
