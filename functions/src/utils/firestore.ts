import * as admin from 'firebase-admin';

const db = admin.firestore();

export async function writeDailyGuidance(
  uid: string,
  date: string,
  data: { message: string; affirmation?: string; action?: string; generatedAt: string }
): Promise<void> {
  await db.collection('v3_daily_guidance').doc(uid).collection('days').doc(date).set({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function writeBlueprint(
  uid: string,
  data: { title: string; summary: string; sections: Array<{ title: string; content: string }>; generatedAt: string }
): Promise<void> {
  await db.collection('v3_blueprints').doc(uid).set({
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
  await db
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
  const sessionDoc = await db.collection('v3_chat_sessions').doc(uid).get();

  if (!sessionDoc.exists) {
    const sessionId = `session_${Date.now()}`;
    await db.collection('v3_chat_sessions').doc(uid).set({
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
  const doc = await db.collection('v3_users').doc(uid).get();
  return doc.data() || null;
}

export async function updateUserProfile(uid: string, data: any): Promise<void> {
  await db.collection('v3_users').doc(uid).set(data, { merge: true });
}
