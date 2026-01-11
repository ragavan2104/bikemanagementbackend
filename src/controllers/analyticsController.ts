import { Response } from 'express';
import { db } from '../config/firebase.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse, KPIData, MonthlySalesData, BikeStatus } from '../types/index.js';

export const getKPIData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year, month } = req.query;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month as string) : undefined;

    // Get all sales
    const salesSnapshot = await db.collection('sales').get();
    const allSales = salesSnapshot.docs.map(doc => doc.data());

    // Get all bikes
    const bikesSnapshot = await db.collection('bikes').get();
    const allBikes = bikesSnapshot.docs.map(doc => doc.data());

    // Filter sales by date
    const filteredSales = allSales.filter((sale: any) => {
      if (sale.saleDate && sale.saleDate.toDate) {
        const saleDate = sale.saleDate.toDate();
        const yearMatch = saleDate.getFullYear() === targetYear;
        const monthMatch = targetMonth === undefined || saleDate.getMonth() === targetMonth;
        return yearMatch && monthMatch;
      }
      return false;
    });

    // Filter bikes by date
    const filteredBikes = allBikes.filter((bike: any) => {
      if (bike.createdAt && bike.createdAt.toDate) {
        const createdDate = bike.createdAt.toDate();
        const yearMatch = createdDate.getFullYear() === targetYear;
        const monthMatch = targetMonth === undefined || createdDate.getMonth() === targetMonth;
        return yearMatch && monthMatch;
      }
      return false;
    });

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const totalExpenses = filteredBikes.reduce((sum, bike) => sum + (bike.purchasePrice || 0), 0);
    const totalBikesSold = filteredSales.length;
    const totalBikesAvailable = allBikes.filter(bike => bike.status === BikeStatus.AVAILABLE).length;

    const kpiData: KPIData = {
      totalProfit,
      totalExpenses,
      totalRevenue,
      totalBikesSold,
      totalBikesAvailable
    };

    res.json({
      success: true,
      data: kpiData
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KPI data'
    } as ApiResponse);
  }
};

export const getMonthlySalesData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    // Get sales for the year
    const salesSnapshot = await db.collection('sales').get();
    const sales = salesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get bikes for the year
    const bikesSnapshot = await db.collection('bikes').get();
    const bikes = bikesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const monthlyData: { [key: string]: MonthlySalesData } = {};

    // Initialize months
    for (let i = 0; i < 12; i++) {
      const monthName = new Date(targetYear, i, 1).toLocaleString('default', { month: 'short' });
      monthlyData[i] = {
        month: monthName,
        sales: 0,
        purchases: 0,
        profit: 0
      };
    }

    // Aggregate sales data
    sales.forEach((sale: any) => {
      if (sale.saleDate && sale.saleDate.toDate) {
        const saleDate = sale.saleDate.toDate();
        if (saleDate.getFullYear() === targetYear) {
          const month = saleDate.getMonth();
          monthlyData[month].sales += sale.salePrice || 0;
          monthlyData[month].profit += sale.profit || 0;
        }
      }
    });

    // Aggregate purchase data
    bikes.forEach((bike: any) => {
      if (bike.createdAt && bike.createdAt.toDate) {
        const createdDate = bike.createdAt.toDate();
        if (createdDate.getFullYear() === targetYear) {
          const month = createdDate.getMonth();
          monthlyData[month].purchases += bike.purchasePrice || 0;
        }
      }
    });

    const chartData = Object.values(monthlyData);

    res.json({
      success: true,
      data: chartData
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching monthly sales data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly sales data'
    } as ApiResponse);
  }
};
