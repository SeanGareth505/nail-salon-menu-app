import { Injectable } from '@angular/core';
import { orderBy } from '@angular/fire/firestore';
import { ConsentTemplate } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class ConsentTemplatesService extends FirestoreBaseRepository<ConsentTemplate> {
  protected readonly path = 'consentTemplates';

  listAll() {
    return this.list(orderBy('name', 'asc'));
  }
}
