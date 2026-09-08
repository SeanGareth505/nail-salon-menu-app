import { Injectable, computed, inject } from '@angular/core';
import {
  Auth,
  authState,
  signInAnonymously,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Firestore, doc, docData, getDoc } from '@angular/fire/firestore';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom, from, map, of, switchMap, take, type Observable } from 'rxjs';
import { AppUser, Therapist, TherapistStaffAccess } from '../models';
import {
  isTherapistAuthEmail,
  therapistAuthEmail,
  therapistIdFromAuthEmail,
} from './therapist-auth.util';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly functions = inject(Functions);

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

  readonly therapistProfile = toSignal(
    authState(this.auth).pipe(
      switchMap((user) => {
        const therapistId = therapistIdFromAuthEmail(user?.email ?? null);
        if (!therapistId) return of(null);
        return docData(doc(this.firestore, `therapists/${therapistId}`), { idField: 'id' }) as any;
      }),
    ),
    { initialValue: undefined },
  );

  readonly isSignedIn = computed(() => !!this.firebaseUser());
  readonly isKiosk = computed(
    () =>
      this.firebaseUser()?.isAnonymous === true ||
      (this.firebaseUser() as User | null | undefined)?.uid === 'tablet-consent-kiosk',
  );
  readonly isTherapist = computed(() => isTherapistAuthEmail(this.firebaseUser()?.email ?? null));
  readonly isAdmin = computed(
    () => this.isSignedIn() && !this.isKiosk() && !this.isTherapist(),
  );
  readonly therapistId = computed(() => therapistIdFromAuthEmail(this.firebaseUser()?.email ?? null));
  readonly ready = computed(() => this.firebaseUser() !== undefined);

  private readonly isTherapist$ = toObservable(this.isTherapist);
  private readonly isSignedIn$ = toObservable(this.isSignedIn);
  private readonly isAdmin$ = toObservable(this.isAdmin);

  readonly displayName = computed(() => {
    const user = this.firebaseUser() as User | null | undefined;
    if (!user) return '';
    if (this.isTherapist()) {
      const therapist = this.therapistProfile() as Therapist | null | undefined;
      if (therapist?.name) return therapist.name;
    }
    const profile = this.appUser() as AppUser | null;
    if (profile?.displayName) return profile.displayName;
    return user.displayName ?? user.email?.split('@')[0] ?? 'Staff';
  });

  readonly therapistRole = computed(() => {
    const therapist = this.therapistProfile() as Therapist | null | undefined;
    return therapist?.role ?? 'Therapist';
  });

  readonly therapistInitial = computed(() => {
    const therapist = this.therapistProfile() as Therapist | null | undefined;
    if (therapist?.initial) return therapist.initial.slice(0, 1).toUpperCase();
    const name = this.displayName();
    return name.split(' ').map((part) => part[0]).join('').slice(0, 1).toUpperCase() || '•';
  });

  currentUid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  async signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async ensureTabletKioskSession(): Promise<void> {
    await firstValueFrom(
      toObservable(this.ready).pipe(
        filter((ready) => ready),
        take(1),
      ),
    );
    if (this.auth.currentUser) return;

    try {
      await signInAnonymously(this.auth);
      return;
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code !== 'auth/admin-restricted-operation' && code !== 'auth/operation-not-allowed') {
        throw error;
      }
    }

    const fn = httpsCallable<Record<string, never>, { token: string }>(
      this.functions,
      'tabletConsentSignIn',
    );
    const result = await fn({});
    await signInWithCustomToken(this.auth, result.data.token);
  }

  async signOutUser(): Promise<void> {
    await signOut(this.auth);
    await this.waitForSignedOut();
  }

  async waitForTherapistSession(): Promise<void> {
    await this.waitForAuthUser((user) => isTherapistAuthEmail(user.email), this.isTherapist$);
  }

  async waitForAdminSession(): Promise<void> {
    await this.waitForAuthUser((user) => !isTherapistAuthEmail(user.email), this.isAdmin$);
  }

  private async waitForAuthUser(
    matches: (user: User) => boolean,
    sessionReady$: Observable<boolean>,
  ): Promise<void> {
    const current = this.auth.currentUser;
    if (current && matches(current)) {
      await this.waitForSignal(sessionReady$);
      return;
    }
    await firstValueFrom(
      authState(this.auth).pipe(
        filter((user): user is User => !!user && matches(user)),
        take(1),
      ),
    );
    await this.waitForSignal(sessionReady$);
  }

  private async waitForSignal(signal$: Observable<boolean>): Promise<void> {
    await firstValueFrom(signal$.pipe(filter((ready) => ready), take(1)));
  }

  private async waitForSignedOut(): Promise<void> {
    if (!this.isSignedIn()) return;
    await firstValueFrom(
      this.isSignedIn$.pipe(
        filter((signedIn) => !signedIn),
        take(1),
      ),
    );
  }

  async signInWithTherapistTap(therapistId: string): Promise<void> {
    try {
      await this.signInWithTherapistTapDirect(therapistId);
    } catch {
      await this.signInWithTherapistTapCallable(therapistId);
    }
  }

  private async signInWithTherapistTapCallable(therapistId: string): Promise<void> {
    const fn = httpsCallable<{ therapistId: string }, { token: string }>(
      this.functions,
      'therapistKioskSignIn',
    );
    const result = await fn({ therapistId });
    await signInWithCustomToken(this.auth, result.data.token);
  }

  private async signInWithTherapistTapDirect(therapistId: string): Promise<void> {
    const accessSnap = await getDoc(doc(this.firestore, `therapistStaffAccess/${therapistId}`));
    if (!accessSnap.exists()) {
      throw new Error('not-provisioned');
    }
    const access = accessSnap.data() as TherapistStaffAccess;
    if (!access.pin) {
      throw new Error('not-provisioned');
    }
    await signInWithEmailAndPassword(this.auth, therapistAuthEmail(therapistId), access.pin);
  }

  async signInWithTherapistPin(pin: string, therapistIds: readonly string[]): Promise<void> {
    for (const therapistId of therapistIds) {
      try {
        await signInWithEmailAndPassword(this.auth, therapistAuthEmail(therapistId), pin);
        return;
      } catch {
        // try next therapist
      }
    }
    throw new Error('invalid-therapist-pin');
  }

  async verifyTherapistPin(pin: string): Promise<boolean> {
    const therapistId = this.therapistId();
    if (!therapistId) return false;
    try {
      await signInWithEmailAndPassword(this.auth, therapistAuthEmail(therapistId), pin);
      return true;
    } catch {
      return false;
    }
  }
}
