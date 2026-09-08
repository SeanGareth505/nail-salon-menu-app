import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AppNotification, NotificationEventType } from '../models';
import { FirestoreBaseRepository } from './firestore-base.repository';

export interface CreateNotificationInput {
  recipientUid: string;
  type: NotificationEventType;
  title: string;
  body: string;
  link?: string;
  entityType?: string;
  entityId?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService extends FirestoreBaseRepository<AppNotification> {
  protected readonly path = 'notifications';

  listForRecipient(uid: string, max = 30): Observable<AppNotification[]> {
    const q = query(
      this.collectionRef(),
      where('recipientUid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    return collectionData(q, { idField: 'id' }) as Observable<AppNotification[]>;
  }

  async createNotification(input: CreateNotificationInput): Promise<string> {
    return this.create({
      recipientUid: input.recipientUid,
      type: input.type,
      title: input.title,
      body: input.body,
      read: false,
      link: input.link ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    } as any);
  }

  async markRead(id: string): Promise<void> {
    await updateDoc(this.docRef(id), { read: true });
  }

  async markAllRead(ids: string[]): Promise<void> {
    await Promise.all(ids.filter(Boolean).map((id) => this.markRead(id)));
  }
}
