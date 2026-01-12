import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  // Handle both escaped and unescaped newlines
  privateKey = privateKey.replace(/\\n/g, '\n');
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export default admin;
