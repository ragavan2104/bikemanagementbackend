import express, { Response } from 'express';
import multer from 'multer';
import { storage } from '../config/firebase.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthRequest } from '../types/index.js';

const router = express.Router();

// Test storage configuration
router.get('/storage/test', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bucket = storage.bucket();
    console.log('Testing storage bucket:', bucket.name);
    
    // Try to get bucket metadata
    const [metadata] = await bucket.getMetadata();
    
    res.json({
      success: true,
      data: {
        bucketName: bucket.name,
        location: metadata.location,
        created: metadata.timeCreated,
        storageClass: metadata.storageClass
      },
      message: 'Storage is configured correctly'
    });
  } catch (error) {
    console.error('Storage test failed:', error);
    
    const err = error as { code?: number; message?: string };
    if (err.code === 404 || err.message?.includes('bucket does not exist')) {
      res.status(404).json({
        success: false,
        error: 'Storage bucket not found',
        details: 'Firebase Storage needs to be set up',
        instructions: [
          '1. Go to Firebase Console: https://console.firebase.google.com',
          '2. Select project: bike-3549c',
          '3. Navigate to Storage',
          '4. Click "Get started"',
          '5. Choose "Start in test mode"',
          '6. Select location (us-central1 recommended)',
          '7. Wait for bucket creation'
        ]
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Storage configuration error',
      details: err.message || 'Unknown error'
    });
  }
});

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const { type } = req.body; // 'bike' or 'aadhar'
    const userId = req.user?.uid;
    
    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }
    
    if (!type || !['bike', 'aadhar'].includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid upload type. Must be "bike" or "aadhar"'
      });
      return;
    }
    
    // Create a safe filename
    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${type}s/${timestamp}_${safeFileName}`;
    
    console.log('Server uploading file:', fileName);
    
    // Get a reference to Firebase Storage
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);
    
    // Create a write stream
    const stream = fileRef.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          originalName: file.originalname
        }
      }
    });
    
    // Handle upload completion using Promise
    await new Promise<void>((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Upload error:', error);
        reject(error);
      });
      
      stream.on('finish', async () => {
        try {
          console.log('Upload completed, getting download URL...');
          
          // Make the file publicly readable
          await fileRef.makePublic();
          
          // Get the public URL
          const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          
          console.log('Download URL generated:', downloadURL);
          
          res.json({
            success: true,
            data: {
              downloadURL,
              fileName,
              fileSize: file.size,
              contentType: file.mimetype
            },
            message: 'File uploaded successfully'
          });
          
          resolve();
        } catch (error) {
          console.error('Error generating download URL:', error);
          reject(error);
        }
      });
      
      // Write the file buffer to the stream
      stream.end(file.buffer);
    });
    
  } catch (error) {
    console.error('Error in upload route:', error);
    
    const err = error as { message?: string };
    
    if (err.message?.includes('Only image files are allowed')) {
      res.status(400).json({
        success: false,
        error: 'Only image files are allowed'
      });
      return;
    }
    
    if (err.message?.includes('bucket does not exist')) {
      res.status(503).json({
        success: false,
        error: 'Storage service unavailable',
        details: 'Firebase Storage bucket not found. Please set up Firebase Storage in the Firebase Console.',
        instructions: [
          '1. Go to Firebase Console',
          '2. Select your project: bike-3549c', 
          '3. Navigate to Storage',
          '4. Click "Get started"',
          '5. Choose security rules (start in test mode)',
          '6. Select a location'
        ]
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      details: err.message || 'Unknown error'
    });
  }
});

export default router;