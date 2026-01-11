import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

async function createTestUsers() {
  try {
    console.log('Creating test users...');
    
    // Create admin user
    const adminUser = await auth.createUser({
      email: 'admin@test.com',
      password: 'Admin123!',
      displayName: 'Admin User',
    });
    
    // Set admin custom claims
    await auth.setCustomUserClaims(adminUser.uid, { role: 'admin' });
    console.log('✅ Admin user created:', adminUser.email);

    // Create worker user  
    const workerUser = await auth.createUser({
      email: 'worker@test.com',
      password: 'Worker123!',
      displayName: 'Worker User',
    });
    
    // Set worker custom claims
    await auth.setCustomUserClaims(workerUser.uid, { role: 'worker' });
    console.log('✅ Worker user created:', workerUser.email);
    
    console.log('\n🎉 Test users created successfully!');
    console.log('\nYou can now login with:');
    console.log('Admin: admin@test.com / Admin123!');
    console.log('Worker: worker@test.com / Worker123!');
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('ℹ️  Users already exist. Updating their custom claims...');
      
      try {
        // Get existing users and update their roles
        const adminUser = await auth.getUserByEmail('admin@test.com');
        await auth.setCustomUserClaims(adminUser.uid, { role: 'admin' });
        console.log('✅ Admin user role updated');
        
        const workerUser = await auth.getUserByEmail('worker@test.com');
        await auth.setCustomUserClaims(workerUser.uid, { role: 'worker' });
        console.log('✅ Worker user role updated');
        
      } catch (updateError) {
        console.error('Error updating user roles:', updateError.message);
      }
    } else {
      console.error('Error creating users:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

createTestUsers();