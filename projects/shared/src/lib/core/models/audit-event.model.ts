import { FsTimestamp, WithId } from './common.model';

export type AuditAction = 'create' | 'update' | 'delete' | 'publish' | 'sign' | 'review' | 'login' | 'export';

export interface AuditEvent extends WithId {
  action: AuditAction;
  entityType: string;
  entityId: string;
  actorUid: string;
  actorName: string;
  actorRole: 'admin' | 'therapist' | 'system';
  summary: string;
  at: FsTimestamp | null;
  metadata?: Record<string, unknown>;
}
