import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuditAction, AuditEvent } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  listRecent(max = 50): Observable<AuditEvent[]> {
    const q = query(collection(this.firestore, 'auditEvents'), orderBy('at', 'desc'), limit(max));
    return collectionData(q, { idField: 'id' }) as Observable<AuditEvent[]>;
  }

  async log(
    action: AuditAction,
    entityType: string,
    entityId: string,
    summary: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await addDoc(collection(this.firestore, 'auditEvents'), {
      action,
      entityType,
      entityId,
      actorUid: this.auth.currentUid() ?? 'anonymous',
      actorName: this.auth.displayName() || 'Unknown',
      actorRole: this.auth.isAdmin() ? 'admin' : 'therapist',
      summary,
      at: serverTimestamp(),
      metadata: metadata ?? null,
    });
  }
}
