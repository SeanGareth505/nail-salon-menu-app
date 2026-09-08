import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ClientsService } from '../../../core/services/clients.service';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { SfPageActionDirective } from '../../../shared/directives/page-action.directive';
import { SfPhoneMaskDirective } from '../../../shared/directives/phone-mask.directive';
import { SfEmailMaskDirective } from '../../../shared/directives/email-mask.directive';
import { SfIcon } from '../../../shared/components/icon/icon';
import { formatEmailInput, isValidEmail } from '../../../core/utils/email.util';
import { formatPhoneInput, isValidPhone } from '../../../core/utils/phone.util';
import { ClientDuplicateError } from '../../../core/utils/client-validation.util';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, SfPageActionDirective, SfIcon, SfPhoneMaskDirective, SfEmailMaskDirective],
  templateUrl: './clients.html',
  styleUrl: './clients.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clients {
  private readonly clientsSvc = inject(ClientsService);
  private readonly consultationsSvc = inject(ConsultationsService);

  readonly formatPhoneInput = formatPhoneInput;
  readonly formatEmailInput = formatEmailInput;

  readonly pageAction = (): void => this.startAdd();

  readonly clients = toSignal(this.clientsSvc.listAll(), { initialValue: [] });
  readonly consultations = toSignal(this.consultationsSvc.listRecent(500), { initialValue: [] });
  readonly search = signal('');
  readonly adding = signal(false);
  readonly newFirstName = signal('');
  readonly newLastName = signal('');
  readonly newPhone = signal('');
  readonly newEmail = signal('');
  readonly saving = signal(false);
  readonly validationError = signal('');

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.clients();
    return this.clients().filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  });

  startAdd(): void {
    this.adding.set(true);
    this.newFirstName.set('');
    this.newLastName.set('');
    this.newPhone.set('');
    this.newEmail.set('');
    this.validationError.set('');
  }

  cancelAdd(): void {
    this.adding.set(false);
    this.validationError.set('');
  }

  async saveClient(): Promise<void> {
    const firstName = this.newFirstName().trim();
    const lastName = this.newLastName().trim();
    const phone = this.newPhone().trim();
    const email = formatEmailInput(this.newEmail());
    if (!firstName || !lastName || !phone) {
      this.validationError.set('First name, last name, and phone are required.');
      return;
    }
    if (!isValidPhone(phone)) {
      this.validationError.set('Enter a valid phone number (e.g. 082 123 4567).');
      return;
    }
    if (email && !isValidEmail(email)) {
      this.validationError.set('Enter a valid email address.');
      return;
    }
    this.validationError.set('');
    this.saving.set(true);
    try {
      await this.clientsSvc.upsertClient({ firstName, lastName, phone, email });
      this.adding.set(false);
    } catch (err) {
      if (err instanceof ClientDuplicateError) {
        this.validationError.set(err.message);
        return;
      }
      this.validationError.set('Could not save client. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  lastVisit(clientId: string): string | null {
    return this.consultations().find((c) => c.clientId === clientId)?.startedAt ?? null;
  }
}
