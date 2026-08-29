import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';

interface QrPreset { label: string; path: string; }

const PRESETS: QrPreset[] = [
  { label: 'Home', path: '/' },
  { label: 'Treatment menu', path: '/treatments' },
  { label: 'Specials', path: '/specials' },
  { label: 'Our team', path: '/therapists' },
  { label: 'Contact', path: '/contact' },
];

@Component({
  selector: 'app-qr-codes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './qr-codes.html',
  styleUrl: './qr-codes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCodes {
  readonly presets = PRESETS;
  readonly baseUrl = signal(typeof window !== 'undefined' ? window.location.origin : 'https://salonflow.app');
  readonly customPath = signal('/');
  readonly images = signal<Record<string, string>>({});

  constructor() {
    this.regenerateAll();
  }

  fullUrl(path: string): string {
    return this.baseUrl().replace(/\/$/, '') + path;
  }

  async regenerateAll(): Promise<void> {
    const entries: Record<string, string> = {};
    for (const preset of this.presets) {
      entries[preset.path] = await QRCode.toDataURL(this.fullUrl(preset.path), {
        margin: 1,
        color: { dark: '#3e5341', light: '#faf6ef' },
        width: 320,
      });
    }
    this.images.set(entries);
  }

  async generateCustom(): Promise<string> {
    return QRCode.toDataURL(this.fullUrl(this.customPath()), {
      margin: 1,
      color: { dark: '#3e5341', light: '#faf6ef' },
      width: 320,
    });
  }

  imageFor(path: string): string | null {
    return this.images()[path] ?? null;
  }

  download(dataUrl: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }
}
