import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { BrandingService } from '../../../core/services/branding.service';
import { StorageUploadService } from '../../../core/services/storage-upload.service';
import { SalonIdentityService } from '../../../core/services/salon-identity.service';
import { BrandingTokens } from '../../../core/models';
import { BRANDING_DEFAULTS, resolveBranding } from '../../../core/theme/theme-defaults';
import { SfPageActionDirective } from '../../../shared/directives/page-action.directive';

const DEFAULTS = BRANDING_DEFAULTS;

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [FormsModule, SfPageActionDirective],
  templateUrl: './branding.html',
  styleUrl: './branding.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Branding {
  private readonly brandingSvc = inject(BrandingService);
  private readonly uploadSvc = inject(StorageUploadService);
  readonly identity = inject(SalonIdentityService);
  private readonly remote = toSignal(this.brandingSvc.get(), { initialValue: undefined });

  readonly pageAction = (): void => {
    void this.save();
  };

  readonly form = signal<BrandingTokens>({ ...DEFAULTS });
  readonly saved = signal(false);
  readonly uploading = signal(false);
  readonly uploadError = signal('');
  private loaded = false;

  readonly swatches: { key: keyof BrandingTokens; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'background', label: 'Background' },
    { key: 'surface', label: 'Surface' },
    { key: 'text', label: 'Text' },
  ];

  constructor() {
    effect(() => {
      const b = this.remote();
      if (b && !this.loaded) {
        this.loaded = true;
        this.form.set(resolveBranding(b));
      }
    });
  }

  set(key: keyof BrandingTokens, value: string): void {
    const next = key === 'markInitial' ? value.trim().slice(0, 2).toUpperCase() : value;
    this.form.update((f) => ({ ...f, [key]: next }));
  }

  async save(): Promise<void> {
    await this.brandingSvc.save(this.form());
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }

  resetToDefault(): void {
    this.form.set({ ...DEFAULTS });
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploadError.set('');
    this.uploading.set(true);
    try {
      const url = await this.uploadSvc.uploadBrandingLogo(file);
      this.set('logoUrl', url);
    } catch {
      this.uploadError.set('Logo upload failed. Check Storage rules and try again.');
    } finally {
      this.uploading.set(false);
    }
  }
}
