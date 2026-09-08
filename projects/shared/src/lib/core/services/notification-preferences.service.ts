import { inject, Injectable } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { doc, docData, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppUser, DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferences } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);

  preferencesFor(uid: string): Observable<NotificationPreferences> {
    return (docData(doc(this.firestore, `users/${uid}`), { idField: 'id' }) as Observable<AppUser | undefined>).pipe(
      map((user) => ({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(user?.notificationPreferences ?? {}),
        events: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.events,
          ...(user?.notificationPreferences?.events ?? {}),
        },
      })),
    );
  }

  currentPreferences(): Observable<NotificationPreferences> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return of(DEFAULT_NOTIFICATION_PREFERENCES);
    return this.preferencesFor(uid);
  }

  async ensureProfile(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    const ref = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    await setDoc(ref, this.newProfile(user));
  }

  async save(preferences: NotificationPreferences): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    await this.ensureProfile();
    await updateDoc(doc(this.firestore, `users/${user.uid}`), {
      notificationPreferences: preferences,
    });
  }

  async saveFcmTokens(tokens: string[]): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    await this.ensureProfile();
    await updateDoc(doc(this.firestore, `users/${user.uid}`), { fcmTokens: tokens });
  }

  private newProfile(user: User): Partial<AppUser> {
    return {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Admin',
      role: 'admin',
      therapistId: null,
      active: true,
      notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
      fcmTokens: [],
    };
  }
}
