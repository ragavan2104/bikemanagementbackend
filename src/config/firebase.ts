import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Debug: Log environment variable status (not the values for security)
console.log('Firebase Config Check:');
console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING');
console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING');
console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING');

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

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
    });
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export default admin;
