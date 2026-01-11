// Firebase Storage Setup Instructions
// Run this script to check and configure Firebase Storage

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

async function setupFirebaseStorage() {
  try {
    console.log('🔥 Checking Firebase Storage Configuration...');
    
    // Check if admin is already initialized
    if (!admin.apps.length) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });
    }

    const bucket = admin.storage().bucket();
    
    // Check if bucket exists and is accessible
    const [exists] = await bucket.exists();
    if (exists) {
      console.log('✅ Storage bucket exists and is accessible');
    } else {
      console.log('❌ Storage bucket not found');
      return;
    }

    // Test file upload (optional)
    const testFile = bucket.file('test/test.txt');
    await testFile.save('Hello Firebase Storage!');
    console.log('✅ Test file upload successful');
    
    // Clean up test file
    await testFile.delete();
    console.log('✅ Test file cleanup successful');

    console.log('\n📋 Manual Setup Required:');
    console.log('1. Go to Firebase Console > Storage');
    console.log('2. Click on "Rules" tab');
    console.log('3. Replace existing rules with:');
    console.log(`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
    `);
    console.log('4. Click "Publish"');
    console.log('\n🔥 Firebase Storage is ready!');

  } catch (error) {
    console.error('❌ Error setting up Firebase Storage:', error);
    console.log('\n📋 Manual Setup Steps:');
    console.log('1. Ensure Storage is enabled in Firebase Console');
    console.log('2. Update Storage rules to allow authenticated access');
    console.log('3. Verify bucket name matches your project ID');
  } finally {
    process.exit(0);
  }
}

setupFirebaseStorage();