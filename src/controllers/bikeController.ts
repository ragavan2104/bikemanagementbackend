import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../config/firebase.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse, Bike, BikeStatus } from '../types/index.js';
import { FieldValue } from 'firebase-admin/firestore';

export const validateAddBike = [
  body('bikeName').trim().notEmpty().withMessage('Bike name is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Year must be valid'),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
  body('ownerPhone').trim().notEmpty().withMessage('Phone number is required'),
  body('ownerAadhar').matches(/^\d{12}$/)
    .withMessage('Owner Aadhar number must be exactly 12 digits'),
  body('ownerAddress').trim().notEmpty().withMessage('Owner address is required'),
  body('purchasePrice').isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),
  body('sellingPrice').isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number')
];

export const addBike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        data: errors.array()
      } as ApiResponse);
      return;
    }

    const { bikeName, year, registrationNumber, ownerPhone, ownerAadhar, ownerAddress, purchasePrice, sellingPrice } = req.body;

    const bikeData: Omit<Bike, 'id'> = {
      bikeName,
      year: parseInt(year),
      registrationNumber,
      ownerPhone,
      ownerAadhar,
      ownerAddress,
      purchasePrice: parseFloat(purchasePrice),
      sellingPrice: parseFloat(sellingPrice),
      status: BikeStatus.AVAILABLE,
      addedBy: req.user!.uid,
      createdAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any
    };

    const docRef = await db.collection('bikes').add(bikeData);
    const bike = await docRef.get();

    res.status(201).json({
      success: true,
      data: { id: bike.id, ...bike.data() },
      message: 'Bike added successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error adding bike:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add bike'
    } as ApiResponse);
  }
};

export const getAllBikes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    
    let query = db.collection('bikes').orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();
    const bikes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: bikes,
      message: 'Bikes fetched successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching bikes:', error);
    
    // Handle specific Firestore errors
    const err = error as { code?: number; message?: string };
    if (err.code === 5 || err.message?.includes('NOT_FOUND')) {
      res.status(503).json({
        success: false,
        error: 'Database not available. Please set up Firestore database in Firebase Console.',
        details: 'Go to Firebase Console > Firestore Database > Create database'
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bikes'
      } as ApiResponse);
    }
  }
};

export const getBikeById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bikeDoc = await db.collection('bikes').doc(id).get();

    if (!bikeDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Bike not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: { id: bikeDoc.id, ...bikeDoc.data() }
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching bike:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bike'
    } as ApiResponse);
  }
};

export const updateBike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { make, model, year, purchasePrice, imageUrl } = req.body;

    const bikeRef = db.collection('bikes').doc(id);
    const bikeDoc = await bikeRef.get();

    if (!bikeDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Bike not found'
      } as ApiResponse);
      return;
    }

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (make) updateData.make = make;
    if (model) updateData.model = model;
    if (year) updateData.year = parseInt(year);
    if (purchasePrice) updateData.purchasePrice = parseFloat(purchasePrice);
    if (imageUrl) updateData.imageUrl = imageUrl;

    await bikeRef.update(updateData);

    const updatedBike = await bikeRef.get();

    res.json({
      success: true,
      data: { id: updatedBike.id, ...updatedBike.data() },
      message: 'Bike updated successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating bike:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bike'
    } as ApiResponse);
  }
};

export const deleteBike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bikeRef = db.collection('bikes').doc(id);
    const bikeDoc = await bikeRef.get();

    if (!bikeDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Bike not found'
      } as ApiResponse);
      return;
    }

    // Delete the bike
    await bikeRef.delete();

    // Also delete any associated sales data
    const salesSnapshot = await db.collection('sales').where('bikeId', '==', id).get();
    const batch = db.batch();
    
    salesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Commit the batch delete
    await batch.commit();

    res.json({
      success: true,
      message: 'Bike and associated sales data deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting bike:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete bike'
    } as ApiResponse);
  }
};
