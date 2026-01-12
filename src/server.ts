import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import bikeRoutes from './routes/bikeRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import debugRoutes from './routes/debugRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'https://bikemanagmentfront.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Root route
app.get('/', (_req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Bike Management API',
    endpoints: {
      health: '/health',
      bikes: '/api/bikes',
      sales: '/api/sales',
      analytics: '/api/analytics',
      users: '/api/users'
    }
  });
});

// API Routes
app.use('/api/bikes', bikeRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/users', userRoutes);
app.use('/api', uploadRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server only in non-serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
