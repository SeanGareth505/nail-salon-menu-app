import { Injectable } from '@angular/core';
import { TherapistStaffAccess } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class TherapistStaffAccessService extends FirestoreBaseRepository<TherapistStaffAccess> {
  protected readonly path = 'therapistStaffAccess';

  listAll() {
    return this.list();
  }

  async savePin(therapistId: string, pin: string): Promise<void> {
    await this.createWithId(therapistId, { therapistId, pin });
  }

  async removeForTherapist(therapistId: string): Promise<void> {
    await this.remove(therapistId);
  }
}
