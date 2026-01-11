import { Response } from 'express';
import { auth, db } from '../config/firebase.js';
import type { ApiResponse, User, AuthRequest } from '../types/index.js';

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];

    res.json({
      success: true,
      data: users
    } as ApiResponse<User[]>);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    } as ApiResponse);
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userDoc = await db.collection('users').doc(id).get();

    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    const user = {
      id: userDoc.id,
      ...userDoc.data()
    } as User;

    res.json({
      success: true,
      data: user
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    } as ApiResponse);
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, role, displayName } = req.body;

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName
    });

    // Create user document in Firestore
    const userData = {
      email,
      role,
      displayName,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    const user = {
      id: userRecord.uid,
      ...userData
    } as unknown as User;

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    } as ApiResponse<User>);
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user'
    } as ApiResponse);
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.password;

    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    await userRef.update(updateData);

    const updatedUserDoc = await userRef.get();
    const updatedUser = {
      id: updatedUserDoc.id,
      ...updatedUserDoc.data()
    } as User;

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    } as ApiResponse);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    // Delete user from Firebase Auth
    try {
      await auth.deleteUser(id);
    } catch (authError) {
      console.warn('Failed to delete user from Auth:', authError);
      // Continue with Firestore deletion even if Auth deletion fails
    }

    // Delete user document from Firestore
    await db.collection('users').doc(id).delete();

    res.json({
      success: true,
      message: 'User deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    } as ApiResponse);
  }
};

export const validateCreateUser = (req: AuthRequest, res: Response, next: any) => {
  const { email, password, role, displayName } = req.body;
  
  if (!email || !password || !role || !displayName) {
    res.status(400).json({
      success: false,
      error: 'Email, password, role, and display name are required'
    } as ApiResponse);
    return;
  }
  
  if (!['admin', 'worker'].includes(role)) {
    res.status(400).json({
      success: false,
      error: 'Role must be either admin or worker'
    } as ApiResponse);
    return;
  }
  
  next();
};