import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(__dirname, '../projects/shared/src/assets/demo-catalogue.manifest.json');
export const DEMO_MANIFEST = JSON.parse(readFileSync(manifestPath, 'utf8'));
export const DEMO_SEED_SOURCE = DEMO_MANIFEST.seedSource;

export function demoMeta() {
  return { seedSource: DEMO_SEED_SOURCE };
}
