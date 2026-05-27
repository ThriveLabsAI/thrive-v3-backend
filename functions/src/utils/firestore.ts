import * as admin from 'firebase-admin';

function getDb() {
  return admin.firestore();
}

export async function writeDailyGuidance(
  uid: string,
  date: string,
  data: { message: string; affirmation?: string; action?: string; generatedAt: string }
): Promise<void> {
  await getDb().collection('v3_daily_guidance').doc(uid).collection('days').doc(date).set({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function writeBlueprint(uid: string, data: any): Promise<void> {
  await getDb().collection('v3_blueprints').doc(uid).set({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function writeChatMessage(
  uid: string,
  sessionId: string,
  messageId: string,
  data: { role: 'user' | 'assistant'; content: string; createdAt: string }
): Promise<void> {
  await getDb()
    .collection('v3_chat_sessions')
    .doc(uid)
    .collection('sessions')
    .doc(sessionId)
    .collection('messages')
    .doc(messageId)
    .set({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

export async function getOrCreateChatSession(uid: string): Promise<string> {
  const sessionDoc = await getDb().collection('v3_chat_sessions').doc(uid).get();

  if (!sessionDoc.exists) {
    const sessionId = `session_${Date.now()}`;
    await getDb().collection('v3_chat_sessions').doc(uid).set({
      currentSessionId: sessionId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return sessionId;
  }

  const data = sessionDoc.data();
  return data?.currentSessionId || `session_${Date.now()}`;
}

export async function getUserProfile(uid: string): Promise<any> {
  const doc = await getDb().collection('v3_users').doc(uid).get();
  return doc.data() || null;
}

export async function updateUserProfile(uid: string, data: any): Promise<void> {
  await getDb().collection('v3_users').doc(uid).set(data, { merge: true });
}

export async function getUserBlueprint(uid: string): Promise<any> {
  const doc = await getDb().collection('v3_blueprints').doc(uid).get();
  return doc.data() || null;
}

export async function getChatMemory(uid: string): Promise<any> {
  const doc = await getDb().collection('v3_chat_memory').doc(uid).get();
  return doc.data() || null;
}

export async function updateChatMemory(uid: string, data: any): Promise<void> {
  await getDb().collection('v3_chat_memory').doc(uid).set({
    ...data,
    lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function getDailyGuidance(uid: string, date: string): Promise<any> {
  const doc = await getDb().collection('v3_daily_guidance').doc(uid).collection('days').doc(date).get();
  return doc.data() || null;
}

export async function storeEntitlement(
  uid: string,
  platform: 'apple' | 'google',
  productId: string,
  transactionId: string,
  originalTransactionId: string,
  expiresAt: Date | null
): Promise<void> {
  await getDb().collection('v3_entitlements').doc(uid).set({
    platform,
    productId,
    transactionId,
    originalTransactionId,
    expiresAt: expiresAt ? admin.firestore.Timestamp.fromDate(expiresAt) : null,
    status: expiresAt && new Date() < expiresAt ? 'active' : 'expired',
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function getEntitlement(uid: string): Promise<any> {
  const doc = await getDb().collection('v3_entitlements').doc(uid).get();
  return doc.data() || null;
}

export async function updateEntitlementStatus(uid: string, status: 'active' | 'expired' | 'refunded' | 'cancelled'): Promise<void> {
  await getDb().collection('v3_entitlements').doc(uid).update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
