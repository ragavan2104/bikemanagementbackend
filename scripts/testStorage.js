import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

try {
  // Use environment variables for service account
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  // Validate environment variables
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Missing Firebase environment variables. Check your .env file.');
  }

  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.projectId,
    storageBucket: `${serviceAccount.projectId}.firebasestorage.app`
  });

  const storage = admin.storage();

  async function testStorageSetup() {
    console.log('🔍 Testing Firebase Storage Setup...');
    console.log('📊 Project ID:', admin.app().options.projectId);
    console.log('🗂️  Storage Bucket:', admin.app().options.storageBucket);
    
    try {
      const bucket = storage.bucket();
      console.log('🪣 Bucket Name:', bucket.name);
      
      // Try to get bucket metadata
      console.log('📋 Getting bucket metadata...');
      const [metadata] = await bucket.getMetadata();
      
      console.log('✅ Firebase Storage is properly configured!');
      console.log('📍 Location:', metadata.location);
      console.log('📅 Created:', metadata.timeCreated);
      console.log('🏷️  Storage Class:', metadata.storageClass);
      
      // Test a simple file upload
      console.log('\n🧪 Testing file upload capability...');
      const testFile = Buffer.from('test content');
      const testFileName = `test-uploads/test-${Date.now()}.txt`;
      
      const fileRef = bucket.file(testFileName);
      await fileRef.save(testFile, {
        metadata: {
          contentType: 'text/plain',
          metadata: {
            test: 'true',
            createdAt: new Date().toISOString()
          }
        }
      });
      
      console.log('✅ Test upload successful!');
      console.log('🧹 Cleaning up test file...');
      
      // Delete test file
      await fileRef.delete();
      console.log('✅ Test file deleted');
      
      console.log('\n🎉 Storage setup is complete and working!');
      console.log('💡 Your bike management app can now handle image uploads');
      
    } catch (error) {
      console.error('❌ Storage test failed:', error.message);
      
      if (error.code === 404 || error.message.includes('bucket does not exist')) {
        console.log('\n🔧 Firebase Storage Setup Required:');
        console.log('1. Go to Firebase Console: https://console.firebase.google.com');
        console.log('2. Select your project: bike-3549c');
        console.log('3. In the left sidebar, click "Storage"');
        console.log('4. Click "Get started" button');
        console.log('5. Review security rules (choose "Start in test mode" for development)');
        console.log('6. Choose a location (us-central1 recommended)');
        console.log('7. Click "Done" and wait for bucket creation');
        console.log('8. Run this script again to verify setup');
        
        console.log('\n📋 After setup, you can configure security rules:');
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
      } else {
        console.log('\n💡 Possible solutions:');
        console.log('- Verify the service account has Storage Admin permissions');
        console.log('- Check that the project ID is correct');
        console.log('- Ensure Firebase Storage is enabled for this project');
      }
      
      return false;
    }
    
    return true;
  }

  // Run the test
  testStorageSetup()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Setup error:', error.message);
  console.log('🔧 Check that the Firebase service account JSON file exists and is valid');
  process.exit(1);
}