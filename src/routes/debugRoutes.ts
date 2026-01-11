import { Router, Request, Response } from 'express';
import admin from 'firebase-admin';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Debug endpoint to check user roles
router.get('/debug/user-role', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'No user found' });
      return;
    }

    // Get the user's custom claims
    const userRecord = await admin.auth().getUser(user.uid);
    
    res.json({
      uid: user.uid,
      email: user.email,
      customClaims: userRecord.customClaims,
      tokenClaims: user
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to manually set user role (for testing)
router.post('/debug/set-role', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role } = req.body;
    
    if (!email || !role) {
      res.status(400).json({ error: 'Email and role are required' });
      return;
    }

    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    
    res.json({ message: `Role ${role} set for user ${email}` });
  } catch (error) {
    console.error('Error setting user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;