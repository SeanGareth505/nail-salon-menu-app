import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SalonSettingsService } from '../../../core/services/salon-settings.service';
import { SfIcon } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [SfIcon],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly settingsSvc = inject(SalonSettingsService);
  readonly settings = toSignal(this.settingsSvc.get(), { initialValue: undefined });
}
