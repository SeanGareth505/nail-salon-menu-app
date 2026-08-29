import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideLottieOptions, provideCacheableAnimationLoader } from 'ngx-lottie';
import { provideServiceWorker } from '@angular/service-worker';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth, browserLocalPersistence, setPersistence } from '@angular/fire/auth';
import {
  getFirestore,
  provideFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from '@angular/fire/firestore';
import { getStorage, provideStorage, connectStorageEmulator } from '@angular/fire/storage';
import {
  provideAppCheck,
  initializeAppCheck,
  ReCaptchaV3Provider,
} from '@angular/fire/app-check';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideAnimationsAsync(),
    provideLottieOptions({
      player: () => import('lottie-web'),
    }),
    provideCacheableAnimationLoader(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),

    provideFirebaseApp(() => initializeApp(environment.firebase)),

    // App Check protects Firestore/Storage/Auth from abuse. In dev, when no
    // site key is configured, fall back to a debug provider so local builds
    // still work — register the printed debug token in the Firebase console
    // under App Check > Apps > salonflow-web > Manage debug tokens.
    provideAppCheck(() => {
      if (isDevMode() && environment.appCheckDebugToken) {
        (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN =
          environment.appCheckDebugToken;
      }
      if (!isDevMode() && environment.appCheckSiteKey) {
        return initializeAppCheck(undefined, {
          provider: new ReCaptchaV3Provider(environment.appCheckSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
      }
      if (isDevMode()) {
        return initializeAppCheck(undefined, {
          provider: new ReCaptchaV3Provider('6LeIxAcTAAAAAGG-vFI1SlNbL8KxTUx0MTTtXzQf'),
          isTokenAutoRefreshEnabled: true,
        });
      }
      return undefined as never;
    }),

    provideAuth(() => {
      const auth = getAuth();
      setPersistence(auth, browserLocalPersistence);
      return auth;
    }),

    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      } else {
        // Best-effort offline cache for the public menu/specials/therapists —
        // lets the client shell degrade gracefully on poor connectivity.
        enableIndexedDbPersistence(firestore).catch(() => void 0);
      }
      return firestore;
    }),

    provideStorage(() => {
      const storage = getStorage();
      if (environment.useEmulators) {
        connectStorageEmulator(storage, 'localhost', 9199);
      }
      return storage;
    }),

    provideAppInitializer(() => void 0),
  ],
};
