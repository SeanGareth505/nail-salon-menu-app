import { Injectable } from '@angular/core';
import { orderBy, where } from '@angular/fire/firestore';
import { ConsentSubmission } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class ConsentSubmissionsService extends FirestoreBaseRepository<ConsentSubmission> {
  protected readonly path = 'consentSubmissions';

  listForClient(clientId: string) {
    return this.list(where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
  }

  listFlagged() {
    return this.list(where('status', '==', 'flagged'), orderBy('createdAt', 'desc'));
  }

  listComplete() {
    return this.list(where('status', '==', 'complete'), orderBy('createdAt', 'desc'));
  }
}
