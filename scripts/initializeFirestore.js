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
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
  });
}

const db = admin.firestore();

async function initializeFirestore() {
  try {
    console.log('🔥 Initializing Firestore Database...');
    
    // Check if Firestore is accessible
    const settings = {
      ignoreUndefinedProperties: true
    };
    db.settings(settings);
    
    console.log('📊 Creating sample data...');
    
    // Create a test bike document to initialize the collection
    const testBike = {
      bikeName: 'Test Royal Enfield Classic 350',
      year: 2023,
      registrationNumber: 'TN01AB1234',
      ownerPhone: '+91 9876543210',
      purchasePrice: 150000,
      sellingPrice: 175000,
      bikeImageUrl: 'https://via.placeholder.com/400x300?text=Test+Bike',
      aadharImageUrl: 'https://via.placeholder.com/400x300?text=Test+Aadhar',
      status: 'available',
      addedBy: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add test bike to bikes collection
    const bikeRef = await db.collection('bikes').add(testBike);
    console.log('✅ Test bike added with ID:', bikeRef.id);
    
    // Create a test sale document to initialize the sales collection
    const testSale = {
      bikeId: bikeRef.id,
      bikeName: 'Test Royal Enfield Classic 350',
      bikeYear: 2023,
      purchasePrice: 150000,
      salePrice: 175000,
      profit: 25000,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '+91 9876543210',
      soldBy: 'system',
      saleDate: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add test sale to sales collection
    const saleRef = await db.collection('sales').add(testSale);
    console.log('✅ Test sale added with ID:', saleRef.id);
    
    // Update the bike status to sold
    await bikeRef.update({
      status: 'sold',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('🎉 Firestore database initialized successfully!');
    console.log('📋 Collections created:');
    console.log('  - bikes');
    console.log('  - sales');
    
    // Test reading the collections
    console.log('🔍 Testing database read operations...');
    
    const bikesSnapshot = await db.collection('bikes').get();
    console.log(`✅ Found ${bikesSnapshot.docs.length} bike(s) in database`);
    
    const salesSnapshot = await db.collection('sales').get();
    console.log(`✅ Found ${salesSnapshot.docs.length} sale(s) in database`);
    
    console.log('✨ Database is ready for use!');
    
  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    
    if (error.code === 'not-found') {
      console.log('\n🔧 Manual Setup Required:');
      console.log('1. Go to Firebase Console > Firestore Database');
      console.log('2. Click "Create database"');
      console.log('3. Choose "Start in test mode" for now');
      console.log('4. Select a location for your database');
      console.log('5. Wait for the database to be created');
      console.log('6. Run this script again');
    } else if (error.code === 'permission-denied') {
      console.log('\n🔧 Permissions Issue:');
      console.log('1. Check Firebase service account permissions');
      console.log('2. Ensure Firestore API is enabled');
      console.log('3. Verify service account has Firestore Admin role');
    }
  } finally {
    process.exit(0);
  }
}

initializeFirestore();