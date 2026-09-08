import { inject, Injectable } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BrandingTokens } from '../models';

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly firestore = inject(Firestore);
  private readonly ref = doc(this.firestore, 'branding/default');

  get(): Observable<BrandingTokens | undefined> {
    return docData(this.ref, { idField: 'id' }) as Observable<BrandingTokens | undefined>;
  }

  async save(value: Partial<BrandingTokens>): Promise<void> {
    await setDoc(this.ref, value, { merge: true });
  }
}
