import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

initializeApp();

const THERAPIST_AUTH_DOMAIN = 'staff.salonflow.internal';
const TABLET_KIOSK_UID = 'tablet-consent-kiosk';
const TABLET_KIOSK_EMAIL = `tablet-kiosk@${THERAPIST_AUTH_DOMAIN}`;

function therapistAuthEmail(therapistId: string): string {
  return `t-${therapistId}@${THERAPIST_AUTH_DOMAIN}`;
}

async function ensureTabletKioskUser(): Promise<string> {
  const auth = getAuth();
  try {
    const user = await auth.getUser(TABLET_KIOSK_UID);
    return user.uid;
  } catch {
    const user = await auth.createUser({
      uid: TABLET_KIOSK_UID,
      email: TABLET_KIOSK_EMAIL,
      emailVerified: true,
      disabled: false,
    });
    return user.uid;
  }
}

export const tabletConsentSignIn = onCall(async () => {
  try {
    const uid = await ensureTabletKioskUser();
    const token = await getAuth().createCustomToken(uid, { kiosk: true });
    return { token };
  } catch (error: unknown) {
    logger.error('tabletConsentSignIn failed', error);
    throw new HttpsError('internal', 'Tablet sign-in failed.');
  }
});

export const therapistKioskSignIn = onCall(async (request) => {
  try {
    const therapistId = request.data?.therapistId;
    if (typeof therapistId !== 'string' || !therapistId.trim()) {
      throw new HttpsError('invalid-argument', 'Therapist id is required.');
    }

    const db = getFirestore();
    const therapistSnap = await db.doc(`therapists/${therapistId}`).get();
    if (!therapistSnap.exists) {
      throw new HttpsError('not-found', 'Therapist not found.');
    }

    const therapist = therapistSnap.data()!;
    if (!therapist.active) {
      throw new HttpsError('failed-precondition', 'Therapist is not active.');
    }
    if (therapist.pinEnabled) {
      throw new HttpsError('failed-precondition', 'PIN sign-in is required for this therapist.');
    }

    const staffSnap = await db.doc(`therapistStaffAccess/${therapistId}`).get();
    if (!staffSnap.exists) {
      throw new HttpsError('failed-precondition', 'Tablet sign-in has not been set up yet.');
    }

    const email = therapistAuthEmail(therapistId);
    let uid: string;
    try {
      const user = await getAuth().getUserByEmail(email);
      uid = user.uid;
    } catch {
      throw new HttpsError('failed-precondition', 'Therapist account is not ready.');
    }

    const token = await getAuth().createCustomToken(uid, { therapistId, kiosk: true });
    return { token };
  } catch (error: unknown) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error('therapistKioskSignIn failed', error);
    throw new HttpsError('internal', 'Tablet sign-in failed.');
  }
});

export const deliverAdminPush = onDocumentCreated('notifications/{notificationId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const recipientUid = data.recipientUid as string | undefined;
  if (!recipientUid) return;

  const userSnap = await getFirestore().doc(`users/${recipientUid}`).get();
  const user = userSnap.data();
  if (!user?.notificationPreferences?.pushEnabled) return;

  const tokens = (user.fcmTokens as string[] | undefined) ?? [];
  if (!tokens.length) return;

  const link = typeof data.link === 'string' ? data.link : '';
  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: String(data.title ?? 'SalonFlow'),
      body: String(data.body ?? ''),
    },
    data: {
      link,
      type: String(data.type ?? ''),
      notificationId: event.params.notificationId,
    },
  });

  const staleTokens = response.responses
    .map((item, index) => (item.success ? null : tokens[index]))
    .filter((token): token is string => !!token);

  if (staleTokens.length) {
    const remaining = tokens.filter((token) => !staleTokens.includes(token));
    await getFirestore().doc(`users/${recipientUid}`).update({ fcmTokens: remaining });
  }
});
