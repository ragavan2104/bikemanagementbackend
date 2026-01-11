# Firestore Database Setup Guide

## Issue: Database Not Found
The error "5 NOT_FOUND" indicates that your Firestore database hasn't been created yet in your Firebase project.

## Setup Steps

### 1. Create Firestore Database
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **bike-management-6b8dc**
3. In the left sidebar, click **Firestore Database**
4. Click **Create database** button
5. Choose **Start in test mode** (for development)
6. Select a location (recommended: **us-central1**)
7. Click **Done** and wait for the database to be created

### 2. Configure Security Rules (Optional)
After database creation, you can set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Initialize with Sample Data
After creating the database, run:
```bash
cd server
node scripts/testFirestore.js
```

## Troubleshooting

### Common Issues:
1. **Database not created**: Follow step 1 above
2. **Wrong project**: Verify project ID in Firebase Console
3. **Permission issues**: Ensure service account has Firestore permissions

### Verify Setup:
- Check Firebase Console > Firestore Database shows your database
- Project ID matches: `bike-management-6b8dc`
- Service account JSON file is properly placed

## Next Steps
Once database is created:
1. Run the test script to verify connection
2. Initialize with sample data
3. Test the bike management application