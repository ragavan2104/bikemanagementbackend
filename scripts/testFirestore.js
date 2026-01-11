import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function testFirestore() {
  try {
    console.log('🔥 Testing Firestore connection...');
    console.log('📋 Project ID:', process.env.FIREBASE_PROJECT_ID);
    
    // Try to read from Firestore (this will fail if DB doesn't exist)
    const testRef = db.collection('_test').doc('_test');
    
    try {
      await testRef.get();
      console.log('✅ Firestore database exists and is accessible!');
      
      // Try to write test data
      await testRef.set({ 
        test: true, 
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      });
      console.log('✅ Write operation successful');
      
      // Clean up test document
      await testRef.delete();
      console.log('✅ Database is working correctly');
      
    } catch (error) {
      if (error.code === 5 || error.message.includes('NOT_FOUND')) {
        console.log('❌ Firestore database does not exist');
        console.log('\n🔧 Please create Firestore database:');
        console.log('1. Go to https://console.firebase.google.com/');
        console.log(`2. Select project: ${process.env.FIREBASE_PROJECT_ID}`);
        console.log('3. Click "Firestore Database" → "Create database"');
        console.log('4. Choose "Start in test mode"');
        console.log('5. Select a location');
        console.log('6. Run this script again');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Firestore:', error.message);
    console.log('\n🔧 Check your Firebase configuration:');
    console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅' : '❌ Missing');
    console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅' : '❌ Missing');
    console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅' : '❌ Missing');
  } finally {
    process.exit(0);
  }
}

testFirestore();