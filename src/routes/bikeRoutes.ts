import { Router } from 'express';
import {
  addBike,
  getAllBikes,
  getBikeById,
  updateBike,
  deleteBike,
  validateAddBike
} from '../controllers/bikeController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All bike routes require authentication
router.use(authenticate);

router.post('/', validateAddBike, addBike);
router.get('/', getAllBikes);
router.get('/:id', getBikeById);
router.put('/:id', updateBike);
router.delete('/:id', deleteBike);

export default router;
