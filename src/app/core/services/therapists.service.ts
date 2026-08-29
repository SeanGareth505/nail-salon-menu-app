import { Injectable } from '@angular/core';
import { orderBy, where } from '@angular/fire/firestore';
import { Therapist } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class TherapistsService extends FirestoreBaseRepository<Therapist> {
  protected readonly path = 'therapists';

  listActive() {
    return this.list(where('active', '==', true), orderBy('sortOrder', 'asc'));
  }

  listAll() {
    return this.list(orderBy('sortOrder', 'asc'));
  }
}
