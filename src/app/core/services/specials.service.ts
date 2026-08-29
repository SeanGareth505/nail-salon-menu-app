import { Injectable } from '@angular/core';
import { orderBy } from '@angular/fire/firestore';
import { Special } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class SpecialsService extends FirestoreBaseRepository<Special> {
  protected readonly path = 'specials';

  listAll() {
    return this.list(orderBy('endsAt', 'asc'));
  }
}
