import { Injectable } from '@angular/core';
import { orderBy, serverTimestamp, where, writeBatch } from '@angular/fire/firestore';
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

  async reorder(updates: { id: string; sortOrder: number }[]): Promise<void> {
    return this.loading.run(async () => {
      const uid = this.auth.currentUid();
      const batch = writeBatch(this.firestore);
      for (const { id, sortOrder } of updates) {
        batch.update(this.docRef(id), {
          sortOrder,
          updatedAt: serverTimestamp(),
          updatedBy: uid,
        });
      }
      await batch.commit();
    }, 'Saving order…');
  }
}
