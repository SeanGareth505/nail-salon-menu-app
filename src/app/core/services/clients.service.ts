import { Injectable } from '@angular/core';
import { orderBy } from '@angular/fire/firestore';
import { Client } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class ClientsService extends FirestoreBaseRepository<Client> {
  protected readonly path = 'clients';

  listAll() {
    return this.list(orderBy('fullName', 'asc'));
  }

  /** Merge newly-confirmed answers into the client's prefill snapshot for next time. */
  async updateLastKnownAnswers(clientId: string, answers: Record<string, unknown>): Promise<void> {
    await this.update(clientId, {
      lastKnownAnswers: answers,
      lastKnownAnswersUpdatedAt: new Date().toISOString(),
    } as any);
  }
}
