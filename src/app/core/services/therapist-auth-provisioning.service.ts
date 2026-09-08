import { inject, Injectable } from '@angular/core';
import { getApps, initializeApp } from '@angular/fire/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { therapistAuthEmail } from '../auth/therapist-auth.util';
import { LoadingService } from './loading.service';
import { TherapistStaffAccessService } from './therapist-staff-access.service';

const SECONDARY_APP = 'salonflow-therapist-provision';

@Injectable({ providedIn: 'root' })
export class TherapistAuthProvisioningService {
  private readonly staffAccessSvc = inject(TherapistStaffAccessService);
  private readonly loading = inject(LoadingService);

  private secondaryAuth(): Auth {
    const existing = getApps().find((app) => app.name === SECONDARY_APP);
    const app = existing ?? initializeApp(environment.firebase, SECONDARY_APP);
    return getAuth(app);
  }

  async setPin(therapistId: string, pin: string, existingPin?: string | null): Promise<void> {
    return this.loading.run(async () => {
      const email = therapistAuthEmail(therapistId);
      const auth = this.secondaryAuth();
      try {
        await createUserWithEmailAndPassword(auth, email, pin);
      } catch (error: unknown) {
        const code = (error as { code?: string }).code;
        if (code !== 'auth/email-already-in-use') throw error;
        let currentPin = existingPin ?? null;
        if (!currentPin) {
          const record = await firstValueFrom(this.staffAccessSvc.get(therapistId));
          currentPin = record?.pin ?? null;
        }
        if (!currentPin) {
          throw new Error('PIN account exists but stored PIN is missing. Set a new PIN to recreate access.');
        }
        const cred = await signInWithEmailAndPassword(auth, email, currentPin);
        await updatePassword(cred.user, pin);
      } finally {
        await signOut(auth);
      }

      await this.staffAccessSvc.savePin(therapistId, pin);
    }, 'Setting up tablet sign-in…');
  }

  async revokePin(therapistId: string): Promise<void> {
    await this.staffAccessSvc.removeForTherapist(therapistId);
  }
}
