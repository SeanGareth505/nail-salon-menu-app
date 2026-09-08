import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';
import { APP_ENVIRONMENT } from '@core/environment/app-environment';
import { SfPageActionDirective } from '@shared/directives/page-action.directive';

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
  imports: [FormsModule, SfPageActionDirective],
  templateUrl: './qr-codes.html',
  styleUrl: './qr-codes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCodes {
  private readonly environment = inject(APP_ENVIRONMENT);
  readonly presets = PRESETS;
  readonly baseUrl = signal(this.environment.publicOrigin);
  readonly customPath = signal('/book');
  readonly customLabel = signal('Custom link');
  readonly images = signal<Record<string, string>>({});
  readonly customImage = signal<string | null>(null);
  readonly showCustom = signal(false);

  readonly pageAction = (): void => {
    this.showCustom.set(true);
    void this.generateCustom();
  };

  readonly customKey = computed(() => `custom:${this.customPath()}`);

  constructor() {
    void this.regenerateAll();
  }

  fullUrl(path: string): string {
    return this.baseUrl().replace(/\/$/, '') + path;
  }

  async regenerateAll(): Promise<void> {
    const entries: Record<string, string> = {};
    for (const preset of this.presets) {
      entries[preset.path] = await this.makeQr(this.fullUrl(preset.path));
    }
    this.images.set(entries);
    if (this.showCustom()) {
      await this.generateCustom();
    }
  }

  async generateCustom(): Promise<void> {
    const path = this.customPath().startsWith('/') ? this.customPath() : `/${this.customPath()}`;
    this.customPath.set(path);
    const dataUrl = await this.makeQr(this.fullUrl(path));
    this.customImage.set(dataUrl);
    this.images.update((current) => ({ ...current, [this.customKey()]: dataUrl }));
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

  downloadPreset(dataUrl: string, label: string): void {
    const slug = label.toLowerCase().replace(/\s+/g, '-');
    this.download(dataUrl, `${slug}-qr.png`);
  }

  private makeQr(url: string): Promise<string> {
    return QRCode.toDataURL(url, {
      margin: 1,
      color: { dark: '#2f5f6a', light: '#ffffff' },
      width: 320,
    });
  }
}
