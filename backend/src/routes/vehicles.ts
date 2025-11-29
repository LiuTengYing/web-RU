import express, { Request, Response } from 'express';
import { Vehicle } from '../models/Vehicle';

const router = express.Router();

/**
 * Get all vehicles
 * GET /api/vehicles
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10000, brand, search } = req.query;
    
    const query: any = {};
    
    if (brand) {
      query.brand = brand;
    }
    
    if (search) {
      query.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { modelName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    res.json({
      success: true,
      data: {
        items: vehicles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Failed to get vehicles:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get vehicles'
    });
  }
});

/**
 * Get vehicle by ID
 * GET /api/vehicles/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Failed to get vehicle:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get vehicle'
    });
  }
});

/**
 * Create vehicle
 * POST /api/vehicles
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { brand, modelName, year, password } = req.body;
    
    // Get next ID
    const lastVehicle = await Vehicle.findOne().sort({ id: -1 });
    const nextId = lastVehicle ? lastVehicle.id + 1 : 1;
    
    const vehicle = new Vehicle({
      id: nextId,
      brand,
      modelName,
      year,
      password: password || '',
      documents: 0
    });
    
    await vehicle.save();
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Failed to create vehicle:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create vehicle'
    });
  }
});

/**
 * Update vehicle
 * PUT /api/vehicles/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { brand, modelName, year, password } = req.body;
    
    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { brand, modelName, year, password },
      { new: true, runValidators: true }
    );
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Failed to update vehicle:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update vehicle'
    });
  }
});

/**
 * Delete vehicle
 * DELETE /api/vehicles/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByIdAndDelete(id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete vehicle:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete vehicle'
    });
  }
});

export default router;

