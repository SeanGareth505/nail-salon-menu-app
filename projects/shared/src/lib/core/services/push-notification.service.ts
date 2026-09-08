import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { deleteToken, getToken, Messaging, onMessage } from '@angular/fire/messaging';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { APP_ENVIRONMENT } from '../environment/app-environment';
import { AppUser } from '../models';
import { NotificationPreferencesService } from './notification-preferences.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly messaging = inject(Messaging, { optional: true });
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly prefsSvc = inject(NotificationPreferencesService);
  private readonly environment = inject(APP_ENVIRONMENT);

  readonly supported = typeof window !== 'undefined' && 'Notification' in window && !!this.messaging;

  async enablePush(): Promise<boolean> {
    if (!this.supported || !this.messaging) return false;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
    const token = await this.fetchToken();
    if (!token) return false;
    await this.persistToken(token);
    this.listenForeground();
    return true;
  }

  async disablePush(): Promise<void> {
    if (!this.messaging) return;
    const token = await this.fetchToken();
    if (token) {
      await deleteToken(this.messaging);
      await this.removeToken(token);
    }
  }

  async syncTokenIfEnabled(): Promise<void> {
    if (!this.supported || !this.messaging || Notification.permission !== 'granted') return;
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    const snap = await getDoc(doc(this.firestore, `users/${uid}`));
    const user = snap.data() as AppUser | undefined;
    if (!user?.notificationPreferences?.pushEnabled) return;
    const token = await this.fetchToken();
    if (token) {
      await this.persistToken(token);
      this.listenForeground();
    }
  }

  private async fetchToken(): Promise<string | null> {
    if (!this.messaging) return null;
    try {
      return await getToken(this.messaging, {
        vapidKey: this.environment.firebaseVapidKey || undefined,
        serviceWorkerRegistration: await this.messagingServiceWorker(),
      });
    } catch {
      return null;
    }
  }

  private async messagingServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
    if (!('serviceWorker' in navigator)) return undefined;
    const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (existing) return existing;
    return navigator.serviceWorker.register('/firebase-messaging-sw.js');
  }

  private listenForeground(): void {
    if (!this.messaging) return;
    onMessage(this.messaging, (message) => {
      const title = message.notification?.title ?? 'SalonFlow';
      const body = message.notification?.body ?? '';
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icons/icon-192x192.png' });
      }
    });
  }

  private async persistToken(token: string): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    const snap = await getDoc(doc(this.firestore, `users/${uid}`));
    const user = snap.data() as AppUser | undefined;
    const tokens = new Set(user?.fcmTokens ?? []);
    tokens.add(token);
    await this.prefsSvc.saveFcmTokens([...tokens]);
  }

  private async removeToken(token: string): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    const snap = await getDoc(doc(this.firestore, `users/${uid}`));
    const user = snap.data() as AppUser | undefined;
    const tokens = (user?.fcmTokens ?? []).filter((value) => value !== token);
    await this.prefsSvc.saveFcmTokens(tokens);
  }
}
