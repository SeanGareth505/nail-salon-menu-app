import { InjectionToken } from '@angular/core';

export interface AppFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface AppEnvironment {
  production: boolean;
  firebase: AppFirebaseConfig;
  appCheckSiteKey: string;
  appCheckDebugToken: string;
  useEmulators: boolean;
  firebaseVapidKey: string;
  publicOrigin: string;
  staffOrigin: string;
}

export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
