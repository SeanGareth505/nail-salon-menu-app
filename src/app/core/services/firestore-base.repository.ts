import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  QueryConstraint,
  serverTimestamp,
  CollectionReference,
  DocumentReference,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuditFields, WithId } from '../models';
import { AuthService } from '../auth/auth.service';
import { LoadingService } from './loading.service';

/**
 * Thin Firestore CRUD base every domain repository extends. Keeps direct
 * Firestore API usage out of components/feature code — UI talks to a
 * typed repository service, never to `@angular/fire/firestore` directly.
 */
@Injectable()
export abstract class FirestoreBaseRepository<T extends WithId & Partial<AuditFields>> {
  protected readonly firestore = inject(Firestore);
  protected readonly auth = inject(AuthService);
  protected readonly loading = inject(LoadingService);

  protected abstract readonly path: string;

  protected collectionRef(): CollectionReference {
    return collection(this.firestore, this.path);
  }

  protected docRef(id: string): DocumentReference {
    return doc(this.firestore, `${this.path}/${id}`);
  }

  list(...constraints: QueryConstraint[]): Observable<T[]> {
    const q = query(this.collectionRef(), ...constraints);
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  get(id: string): Observable<T | undefined> {
    return docData(this.docRef(id), { idField: 'id' }) as Observable<T | undefined>;
  }

  async create(value: Omit<T, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Promise<string> {
    return this.loading.run(async () => {
      const uid = this.auth.currentUid();
      const ref = await addDoc(this.collectionRef(), {
        ...value,
        createdAt: serverTimestamp(),
        createdBy: uid,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
      return ref.id;
    }, 'Saving…');
  }

  async createWithId(id: string, value: Omit<T, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Promise<void> {
    return this.loading.run(async () => {
      const uid = this.auth.currentUid();
      await setDoc(this.docRef(id), {
        ...value,
        createdAt: serverTimestamp(),
        createdBy: uid,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    }, 'Saving…');
  }

  async update(id: string, value: Partial<T>): Promise<void> {
    return this.loading.run(async () => {
      const uid = this.auth.currentUid();
      const { id: _drop, ...rest } = value as any;
      await updateDoc(this.docRef(id), {
        ...rest,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    }, 'Saving…');
  }

  async remove(id: string): Promise<void> {
    return this.loading.run(async () => {
      await deleteDoc(this.docRef(id));
    }, 'Saving…');
  }
}
