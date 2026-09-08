import { Injectable } from '@angular/core';
import { orderBy } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { Client } from '../models';
import { clientFullName } from '../utils/client-name.util';
import { ClientDuplicateError, findClientDuplicate } from '../utils/client-validation.util';
import { FirestoreBaseRepository } from './firestore-base.repository';

export interface UpsertClientInputDto {
  id?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class ClientsService extends FirestoreBaseRepository<Client> {
  protected readonly path = 'clients';

  listAll() {
    return this.list(orderBy('fullName', 'asc'));
  }

  async upsertClient(input: UpsertClientInputDto): Promise<Client> {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const phone = input.phone.trim();
    const email = input.email.trim();
    const fullName = clientFullName(firstName, lastName);

    const existingClients = await firstValueFrom(this.listAll());
    const duplicate = findClientDuplicate(existingClients, {
      phone,
      email,
      excludeId: input.id ?? null,
    });
    if (duplicate) {
      throw new ClientDuplicateError(duplicate);
    }

    if (input.id) {
      await this.update(input.id, { firstName, lastName, fullName, phone, email } as Partial<Client>);
      return { id: input.id, firstName, lastName, fullName, phone, email } as Client;
    }

    const id = await this.create({
      firstName,
      lastName,
      fullName,
      phone,
      email,
      dateOfBirth: null,
      notes: '',
      lastKnownAnswers: {},
      lastKnownAnswersUpdatedAt: null,
      lastConsultationAt: null,
      totalConsultations: 0,
      active: true,
    } as Omit<Client, 'id'>);

    return { id, firstName, lastName, fullName, phone, email } as Client;
  }

  async updateLastKnownAnswers(clientId: string, answers: Record<string, unknown>): Promise<void> {
    await this.update(clientId, {
      lastKnownAnswers: answers,
      lastKnownAnswersUpdatedAt: new Date().toISOString(),
    } as Partial<Client>);
  }
}
