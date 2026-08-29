import { Injectable, computed, inject } from '@angular/core';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import { AppUser } from '../models';
import {
  isTherapistAuthEmail,
  therapistIdFromAuthEmail,
} from './therapist-auth.util';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  readonly firebaseUser = toSignal(authState(this.auth), { initialValue: undefined });

  readonly appUser = toSignal(
    authState(this.auth).pipe(
      switchMap((user) =>
        user && !isTherapistAuthEmail(user.email)
          ? (docData(doc(this.firestore, `users/${user.uid}`), { idField: 'id' }) as any)
          : of(null),
      ),
    ),
    { initialValue: undefined },
  );

  readonly isSignedIn = computed(() => !!this.firebaseUser());
  readonly isTherapist = computed(() => isTherapistAuthEmail(this.firebaseUser()?.email ?? null));
  readonly isAdmin = computed(() => this.isSignedIn() && !this.isTherapist());
  readonly therapistId = computed(() => therapistIdFromAuthEmail(this.firebaseUser()?.email ?? null));
  readonly ready = computed(() => this.firebaseUser() !== undefined);

  readonly displayName = computed(() => {
    const user = this.firebaseUser() as User | null | undefined;
    if (!user) return '';
    const profile = this.appUser() as AppUser | null;
    if (profile?.displayName) return profile.displayName;
    return user.displayName ?? user.email?.split('@')[0] ?? 'Staff';
  });

  currentUid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  async signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async signOutUser(): Promise<void> {
    await signOut(this.auth);
  }
}
