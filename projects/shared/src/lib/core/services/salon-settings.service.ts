import { inject, Injectable } from '@angular/core';
import { Firestore, doc, docData, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { SalonSettings } from '../models';

@Injectable({ providedIn: 'root' })
export class SalonSettingsService {
  private readonly firestore = inject(Firestore);
  private readonly ref = doc(this.firestore, 'salonSettings/default');

  get(): Observable<SalonSettings | undefined> {
    return docData(this.ref, { idField: 'id' }) as Observable<SalonSettings | undefined>;
  }

  async save(value: Partial<SalonSettings>): Promise<void> {
    await setDoc(this.ref, value, { merge: true });
  }
}
