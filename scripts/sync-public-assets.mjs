#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'public');
const targets = [join(root, 'projects/menu/public'), join(root, 'projects/staff/public')];

const entries = ['icons', 'assets', 'favicon.ico'];

for (const target of targets) {
  mkdirSync(target, { recursive: true });
  for (const entry of entries) {
    const from = join(source, entry);
    if (!existsSync(from)) continue;
    const to = join(target, entry);
    cpSync(from, to, { recursive: true });
  }
}

console.log('Synced public assets to menu and staff apps');
