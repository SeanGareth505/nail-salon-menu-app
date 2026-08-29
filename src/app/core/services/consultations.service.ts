import { Injectable } from '@angular/core';
import { limit, orderBy, where } from '@angular/fire/firestore';
import { Consultation } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class ConsultationsService extends FirestoreBaseRepository<Consultation> {
  protected readonly path = 'consultations';

  listRecent(max = 20) {
    return this.list(orderBy('startedAt', 'desc'), limit(max));
  }

  listForTherapist(therapistId: string, max = 50) {
    return this.list(where('therapistId', '==', therapistId), orderBy('startedAt', 'desc'), limit(max));
  }

  listForClient(clientId: string) {
    return this.list(where('clientId', '==', clientId), orderBy('startedAt', 'desc'));
  }
}
