import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideLottieOptions, provideCacheableAnimationLoader } from 'ngx-lottie';
import lottie from 'lottie-web';
import { provideServiceWorker } from '@angular/service-worker';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth, browserLocalPersistence } from '@angular/fire/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  provideFirestore,
} from '@angular/fire/firestore';
import { getApp } from 'firebase/app';
import { persistentLocalCache } from 'firebase/firestore';
import { getStorage, provideStorage, connectStorageEmulator } from '@angular/fire/storage';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { connectFunctionsEmulator, getFunctions, provideFunctions } from '@angular/fire/functions';
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

function appCheckProviders() {
  const siteKey = environment.appCheckSiteKey;
  const debugToken = environment.appCheckDebugToken;
  const enabledInDev = isDevMode() && (!!siteKey || !!debugToken);
  const enabledInProd = !isDevMode() && !!siteKey;

  if (!enabledInDev && !enabledInProd) {
    return [];
  }

  return [
    provideAppCheck(() => {
      if (debugToken) {
        (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN =
          debugToken;
      }
      return initializeAppCheck(undefined, {
        provider: new ReCaptchaV3Provider(siteKey || '6LeIxAcTAAAAAGG-vFI1SlNbL8KxTUx0MTTtXzQf'),
        isTokenAutoRefreshEnabled: true,
      });
    }),
  ];
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideAnimationsAsync(),
    provideLottieOptions({
      player: () => lottie,
    }),
    provideCacheableAnimationLoader(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),

    provideFirebaseApp(() => initializeApp(environment.firebase)),

    ...appCheckProviders(),

    provideAuth(() => {
      const auth = getAuth();
      void auth.setPersistence(browserLocalPersistence).catch(() => void 0);
      return auth;
    }),

    provideFirestore(() => {
      const app = getApp();
      if (environment.useEmulators) {
        const firestore = getFirestore(app);
        connectFirestoreEmulator(firestore, 'localhost', 8080);
        return firestore;
      }
      return initializeFirestore(app, {
        localCache: persistentLocalCache(),
      });
    }),

    provideStorage(() => {
      const storage = getStorage();
      if (environment.useEmulators) {
        connectStorageEmulator(storage, 'localhost', 9199);
      }
      return storage;
    }),

    provideFunctions(() => {
      const functions = getFunctions(getApp(), 'us-central1');
      if (environment.useEmulators) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      return functions;
    }),

    provideMessaging(() => {
      if (typeof window === 'undefined') {
        return undefined as never;
      }
      return getMessaging();
    }),

    provideAppInitializer(() => void 0),
  ],
};
