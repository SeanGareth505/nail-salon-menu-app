import { Injectable } from '@angular/core';
import { orderBy, where } from '@angular/fire/firestore';
import { Category } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class CategoriesService extends FirestoreBaseRepository<Category> {
  protected readonly path = 'categories';

  listActive() {
    return this.list(where('active', '==', true), orderBy('sortOrder', 'asc'));
  }

  listAll() {
    return this.list(orderBy('sortOrder', 'asc'));
  }
}
