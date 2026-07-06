/**
 * ParkWise Backend Server
 * 
 * Main entry point for the Express + Socket.IO server
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Slot, Vehicle } from './models/index.js';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parkwise';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join-parking', () => {
    socket.join('parking-room');
    console.log(`Client ${socket.id} joined parking-room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Socket.IO broadcast functions (attached to app for use in routes)
app.io = io;

const emitParkingUpdate = (type, payload = {}) => {
  io.to('parking-room').emit('parking-update', {
    type,
    timestamp: new Date().toISOString(),
    ...payload,
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const DEFAULT_SLOT_NUMBERS = [
  'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09',
  'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09',
  'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09',
];

const ensureSlotsExist = async () => {
  const existing = await Slot.find({}).sort({ slotNumber: 1 });
  if (existing.length > 0) return existing;

  const slots = DEFAULT_SLOT_NUMBERS.map((slotNumber) => ({
    slotNumber,
    status: 'available',
    vehicleId: null,
  }));

  await Slot.insertMany(slots);
  return slots;
};

const buildDashboardStats = async () => {
  const [slots, vehicles] = await Promise.all([
    Slot.find({}).sort({ slotNumber: 1 }),
    Vehicle.find({}).sort({ entryTime: -1 }),
  ]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const totalSlots = slots.length;
  const availableSlots = slots.filter((slot) => slot.status === 'available').length;
  const occupiedSlots = slots.filter((slot) => slot.status === 'occupied').length;
  const occupancyPercentage = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  const todayEntries = vehicles.filter((vehicle) => new Date(vehicle.entryTime) >= todayStart).length;
  const todayExits = vehicles.filter((vehicle) => vehicle.exitTime && new Date(vehicle.exitTime) >= todayStart).length;

  const recentActivity = [];
  vehicles.forEach((vehicle) => {
    if (new Date(vehicle.entryTime) >= todayStart) {
      recentActivity.push({
        type: 'entry',
        vehicleNumber: vehicle.vehicleNumber,
        slotNumber: vehicle.slotNumber,
        time: vehicle.entryTime,
        ownerName: vehicle.ownerName,
      });
    }

    if (vehicle.exitTime && new Date(vehicle.exitTime) >= todayStart) {
      recentActivity.push({
        type: 'exit',
        vehicleNumber: vehicle.vehicleNumber,
        slotNumber: vehicle.slotNumber,
        time: vehicle.exitTime,
        ownerName: vehicle.ownerName,
      });
    }
  });

  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return {
    totalSlots,
    availableSlots,
    occupiedSlots,
    occupancyPercentage,
    todayEntries,
    todayExits,
    recentActivity: recentActivity.slice(0, 10),
  };
};

app.get('/api/slots', async (req, res) => {
  try {
    const slots = await ensureSlotsExist();
    res.json(slots);
  } catch (error) {
    console.error('Error fetching slots:', error.message);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}).sort({ entryTime: -1 });
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error.message);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

app.get('/api/vehicles/search', async (req, res) => {
  try {
    const query = req.query.query?.toString().trim() || '';
    if (!query) {
      return res.json([]);
    }

    const regex = new RegExp(query, 'i');
    const vehicles = await Vehicle.find({
      $or: [
        { vehicleNumber: regex },
        { slotNumber: regex },
      ],
    }).sort({ entryTime: -1 });

    res.json(vehicles);
  } catch (error) {
    console.error('Error searching vehicles:', error.message);
    res.status(500).json({ error: 'Failed to search vehicles' });
  }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const { vehicleNumber, ownerName, vehicleType, slotNumber } = req.body || {};

    if (!vehicleNumber || !ownerName || !vehicleType || !slotNumber) {
      return res.status(400).json({ error: 'Missing required vehicle fields' });
    }

    const normalizedVehicleNumber = vehicleNumber.toUpperCase().trim();
    const existingActiveVehicle = await Vehicle.findOne({
      vehicleNumber: normalizedVehicleNumber,
      isParked: true,
    });

    if (existingActiveVehicle) {
      return res.status(409).json({
        success: false,
        message: `Vehicle ${normalizedVehicleNumber} is already parked at slot ${existingActiveVehicle.slotNumber}`,
      });
    }

    const slot = await Slot.findOne({ slotNumber });
    if (!slot) {
      return res.status(404).json({ success: false, message: `Slot ${slotNumber} was not found` });
    }

    if (slot.status !== 'available') {
      return res.status(409).json({ success: false, message: `Slot ${slotNumber} is not available` });
    }

    const vehicle = await Vehicle.create({
      vehicleNumber: normalizedVehicleNumber,
      ownerName: ownerName.trim(),
      vehicleType,
      slotNumber,
      entryTime: new Date(),
      exitTime: null,
      isParked: true,
    });

    slot.status = 'occupied';
    slot.vehicleId = vehicle._id;
    await slot.save();

    console.log(`✅ Saved vehicle entry to MongoDB: ${vehicle.vehicleNumber}`);
    emitParkingUpdate('entry', { vehicle });

    res.status(201).json({
      success: true,
      message: `Vehicle ${vehicle.vehicleNumber} parked at slot ${vehicle.slotNumber}`,
      vehicle,
    });
  } catch (error) {
    console.error('Error creating vehicle entry:', error.message);
    res.status(500).json({ error: 'Failed to create vehicle entry' });
  }
});

app.patch('/api/vehicles/:vehicleNumber/exit', async (req, res) => {
  try {
    const vehicleNumber = req.params.vehicleNumber?.toUpperCase().trim();
    if (!vehicleNumber) {
      return res.status(400).json({ error: 'Vehicle number is required' });
    }

    const vehicle = await Vehicle.findOne({ vehicleNumber, isParked: true });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: `No active vehicle found with number ${vehicleNumber}` });
    }

    vehicle.exitTime = new Date();
    vehicle.isParked = false;
    await vehicle.save();

    const slot = await Slot.findOne({ slotNumber: vehicle.slotNumber });
    if (slot) {
      slot.status = 'available';
      slot.vehicleId = null;
      await slot.save();
    }

    console.log(`✅ Updated vehicle exit in MongoDB: ${vehicle.vehicleNumber}`);
    emitParkingUpdate('exit', { vehicle });

    res.json({ success: true, message: `Vehicle ${vehicle.vehicleNumber} exited from slot ${vehicle.slotNumber}`, vehicle });
  } catch (error) {
    console.error('Error exiting vehicle:', error.message);
    res.status(500).json({ error: 'Failed to exit vehicle' });
  }
});

app.patch('/api/vehicles/exit-by-slot/:slotNumber', async (req, res) => {
  try {
    const slotNumber = req.params.slotNumber?.trim();
    const vehicle = await Vehicle.findOne({ slotNumber, isParked: true });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: `No vehicle found at slot ${slotNumber}` });
    }

    return res.json(await handleVehicleExit(vehicle));
  } catch (error) {
    console.error('Error exiting vehicle by slot:', error.message);
    res.status(500).json({ error: 'Failed to exit vehicle by slot' });
  }
});

const handleVehicleExit = async (vehicle) => {
  vehicle.exitTime = new Date();
  vehicle.isParked = false;
  await vehicle.save();

  const slot = await Slot.findOne({ slotNumber: vehicle.slotNumber });
  if (slot) {
    slot.status = 'available';
    slot.vehicleId = null;
    await slot.save();
  }

  emitParkingUpdate('exit', { vehicle });
  return { success: true, message: `Vehicle ${vehicle.vehicleNumber} exited from slot ${vehicle.slotNumber}`, vehicle };
};

app.get('/api/dashboard', async (req, res) => {
  try {
    const stats = await buildDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const search = req.query.search?.toString().trim() || '';
    let query = Vehicle.find({ isParked: false, exitTime: { $ne: null } }).sort({ exitTime: -1 });

    if (search) {
      const regex = new RegExp(search, 'i');
      query = Vehicle.find({
        isParked: false,
        exitTime: { $ne: null },
        $or: [
          { vehicleNumber: regex },
          { ownerName: regex },
          { slotNumber: regex },
        ],
      }).sort({ exitTime: -1 });
    }

    const vehicles = await query;
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching history:', error.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = Number(process.env.PORT || 5000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ParkWise API server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = PORT + 1;
    console.warn(`Port ${PORT} is busy, trying ${fallbackPort} instead.`);
    server.listen(fallbackPort, '0.0.0.0', () => {
      console.log(`🚀 ParkWise API server running on port ${fallbackPort}`);
      console.log(`🌐 Health check: http://localhost:${fallbackPort}/api/health`);
    });
  } else {
    console.error('Server startup error:', err);
  }
});

export { app, server, io };
