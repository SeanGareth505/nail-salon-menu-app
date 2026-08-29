import { Timestamp } from '@angular/fire/firestore';

/** Firestore timestamp fields come back as Timestamp; we accept Date on write. */
export type FsTimestamp = Timestamp;

export interface AuditFields {
  createdAt: FsTimestamp | null;
  createdBy: string | null;
  updatedAt: FsTimestamp | null;
  updatedBy: string | null;
}

export interface WithId {
  id: string;
}

export type Money = number; // stored in ZAR, major units (Rands), e.g. 350 = R350
