import { Injectable } from '@angular/core';
import { getApps, initializeApp } from '@angular/fire/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from '@angular/fire/auth';
import { environment } from '../../../environments/environment';
import { therapistAuthEmail } from '../auth/therapist-auth.util';

const SECONDARY_APP = 'salonflow-therapist-provision';

@Injectable({ providedIn: 'root' })
export class TherapistAuthProvisioningService {
  private secondaryAuth(): Auth {
    const existing = getApps().find((app) => app.name === SECONDARY_APP);
    const app = existing ?? initializeApp(environment.firebase, SECONDARY_APP);
    return getAuth(app);
  }

  async setPin(therapistId: string, pin: string): Promise<void> {
    const email = therapistAuthEmail(therapistId);
    const auth = this.secondaryAuth();
    try {
      await createUserWithEmailAndPassword(auth, email, pin);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code !== 'auth/email-already-in-use') throw error;
      const cred = await signInWithEmailAndPassword(auth, email, pin);
      await updatePassword(cred.user, pin);
    } finally {
      await signOut(auth);
    }
  }
}
