import { Injectable } from '@angular/core';
import { orderBy } from '@angular/fire/firestore';
import { AppUser } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class UsersService extends FirestoreBaseRepository<AppUser> {
  protected readonly path = 'users';

  listAll() {
    return this.list(orderBy('displayName', 'asc'));
  }
}
