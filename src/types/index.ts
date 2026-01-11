import type { Timestamp } from 'firebase-admin/firestore';
import type { Request } from 'express';

// Auth request type
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

// Using const objects for consistency with client
export const UserRole = {
  ADMIN: 'admin',
  WORKER: 'worker'
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const BikeStatus = {
  AVAILABLE: 'available',
  SOLD: 'sold'
} as const;
export type BikeStatus = typeof BikeStatus[keyof typeof BikeStatus];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  createdAt: Timestamp;
}

export interface Bike {
  id: string;
  bikeName: string;
  year: number;
  registrationNumber: string;
  ownerPhone: string;
  ownerAadhar: string;
  ownerAddress: string;
  purchasePrice: number;
  sellingPrice: number;
  status: BikeStatus;
  addedBy: string; // User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Sale {
  id: string;
  bikeId: string;
  bikeName: string;
  bikeYear: number;
  purchasePrice: number;
  salePrice: number;
  profit: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAadhar: string;
  customerAddress: string;
  soldBy: string; // User ID
  saleDate: Timestamp;
  createdAt: Timestamp;
}

export interface KPIData {
  totalProfit: number;
  totalExpenses: number;
  totalRevenue: number;
  totalBikesSold: number;
  totalBikesAvailable: number;
}

export interface MonthlySalesData {
  month: string;
  sales: number;
  purchases: number;
  profit: number;
}

// Request/Response types
export interface AddBikeRequest {
  make: string;
  model: string;
  year: number;
  purchasePrice: number;
  imageUrl: string;
}

export interface MarkAsSoldRequest {
  salePrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
