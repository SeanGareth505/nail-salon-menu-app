import { Injectable } from '@angular/core';
import { orderBy, where } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { Therapist } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class TherapistsService extends FirestoreBaseRepository<Therapist> {
  protected readonly path = 'therapists';

  private normalize(therapist: Therapist): Therapist {
    return { ...therapist, pinEnabled: therapist.pinEnabled === true };
  }

  private normalizeAll(therapists: Therapist[]): Therapist[] {
    return therapists.map((therapist) => this.normalize(therapist));
  }

  listActive(): Observable<Therapist[]> {
    return this.list(where('active', '==', true), orderBy('sortOrder', 'asc')).pipe(
      map((therapists) => this.normalizeAll(therapists)),
    );
  }

  listAll(): Observable<Therapist[]> {
    return this.list(orderBy('sortOrder', 'asc')).pipe(map((therapists) => this.normalizeAll(therapists)));
  }
}
