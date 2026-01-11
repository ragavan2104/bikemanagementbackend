import { Router } from 'express';
import {
  markBikeAsSold,
  getAllSales,
  getSaleById,
  getSaleByBikeId,
  validateMarkAsSold,
  clearAllSalesData
} from '../controllers/saleController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All sale routes require authentication
router.use(authenticate);

router.post('/bike/:id/sold', validateMarkAsSold, markBikeAsSold);
router.get('/', getAllSales);
router.get('/bike/:bikeId', getSaleByBikeId);
router.get('/:id', getSaleById);
router.delete('/clear-all', clearAllSalesData);

export default router;
