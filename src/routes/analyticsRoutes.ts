import { Router } from 'express';
import { getKPIData, getMonthlySalesData } from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = Router();

// Analytics routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/kpi', getKPIData);
router.get('/monthly-sales', getMonthlySalesData);

export default router;
