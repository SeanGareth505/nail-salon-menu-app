import { Injectable } from '@angular/core';
import { orderBy, where } from '@angular/fire/firestore';
import { Treatment } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class TreatmentsService extends FirestoreBaseRepository<Treatment> {
  protected readonly path = 'treatments';

  listActive() {
    return this.list(where('active', '==', true), orderBy('sortOrder', 'asc'));
  }

  listAll() {
    return this.list(orderBy('sortOrder', 'asc'));
  }

  listByCategory(categoryId: string) {
    return this.list(where('categoryId', '==', categoryId), where('active', '==', true));
  }
}
