import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../config/firebase.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse, Sale, BikeStatus } from '../types/index.js';
import { FieldValue } from 'firebase-admin/firestore';

export const validateMarkAsSold = [
  body('salePrice').isFloat({ min: 0 })
    .withMessage('Sale price must be a positive number'),
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('customerEmail').isEmail().withMessage('Valid email is required'),
  body('customerPhone').trim().notEmpty().withMessage('Customer phone is required'),
  body('customerAadhar').matches(/^\d{12}$/)
    .withMessage('Aadhar number must be exactly 12 digits'),
  body('customerAddress').trim().notEmpty().withMessage('Customer address is required')
];

export const markBikeAsSold = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const { salePrice, customerName, customerEmail, customerPhone, customerAadhar, customerAddress } = req.body;

    const bikeRef = db.collection('bikes').doc(id);
    const bikeDoc = await bikeRef.get();

    if (!bikeDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Bike not found'
      } as ApiResponse);
      return;
    }

    const bikeData = bikeDoc.data();

    if (bikeData?.status === BikeStatus.SOLD) {
      res.status(400).json({
        success: false,
        error: 'Bike is already sold'
      } as ApiResponse);
      return;
    }

    const profit = parseFloat(salePrice) - bikeData!.purchasePrice;

    // Create sale record
    const saleData: Omit<Sale, 'id'> = {
      bikeId: id,
      bikeName: bikeData!.bikeName,
      bikeYear: bikeData!.year,
      purchasePrice: bikeData!.purchasePrice,
      salePrice: parseFloat(salePrice),
      profit,
      customerName,
      customerEmail,
      customerPhone,
      customerAadhar,
      customerAddress,
      soldBy: req.user!.uid,
      saleDate: FieldValue.serverTimestamp() as any,
      createdAt: FieldValue.serverTimestamp() as any
    };

    const saleRef = await db.collection('sales').add(saleData);

    // Update bike status
    await bikeRef.update({
      status: BikeStatus.SOLD,
      updatedAt: FieldValue.serverTimestamp()
    });

    const sale = await saleRef.get();

    res.json({
      success: true,
      data: { id: sale.id, ...sale.data() },
      message: 'Bike marked as sold successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error marking bike as sold:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark bike as sold'
    } as ApiResponse);
  }
};

export const getAllSales = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snapshot = await db.collection('sales')
      .orderBy('saleDate', 'desc')
      .get();

    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: sales
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales'
    } as ApiResponse);
  }
};

export const getSaleByBikeId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bikeId } = req.params;
    const snapshot = await db.collection('sales')
      .where('bikeId', '==', bikeId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({
        success: false,
        error: 'Sale not found for this bike'
      } as ApiResponse);
      return;
    }

    const saleDoc = snapshot.docs[0];
    res.json({
      success: true,
      data: { id: saleDoc.id, ...saleDoc.data() }
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching sale by bike ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sale'
    } as ApiResponse);
  }
};

export const getSaleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const saleDoc = await db.collection('sales').doc(id).get();

    if (!saleDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Sale not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: { id: saleDoc.id, ...saleDoc.data() }
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sale'
    } as ApiResponse);
  }
};

export const clearAllSalesData = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all sales to delete
    const salesSnapshot = await db.collection('sales').get();
    
    // Get all bikes to reset their status
    const bikesSnapshot = await db.collection('bikes').get();
    
    const batch = db.batch();
    
    // Delete all sales
    salesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Reset all bikes to available status
    bikesSnapshot.docs.forEach((doc) => {
      const bikeData = doc.data();
      if (bikeData.status === BikeStatus.SOLD) {
        batch.update(doc.ref, { 
          status: BikeStatus.AVAILABLE,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    });
    
    // Commit all changes
    await batch.commit();
    
    res.json({
      success: true,
      message: `Successfully cleared ${salesSnapshot.size} sales records and reset ${bikesSnapshot.size} bikes to available status`
    } as ApiResponse);
    
  } catch (error) {
    console.error('Error clearing sales data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear sales data'
    } as ApiResponse);
  }
};
