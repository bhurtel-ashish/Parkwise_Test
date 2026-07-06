import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { 
    type: String, 
    required: true, 
    index: true 
  },
  ownerName: { 
    type: String, 
    required: true 
  },
  vehicleType: { 
    type: String, 
    enum: ['Car', 'Bike', 'EV'], 
    required: true 
  },
  slotNumber: { 
    type: String, 
    required: true 
  },
  entryTime: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  exitTime: { 
    type: Date, 
    default: null 
  },
  isParked: { 
    type: Boolean, 
    required: true, 
    default: true 
  },
}, { 
  timestamps: true 
});

// Indexes for efficient queries
vehicleSchema.index({ vehicleNumber: 1, isParked: 1 });
vehicleSchema.index({ slotNumber: 1, isParked: 1 });
vehicleSchema.index({ entryTime: -1 });
vehicleSchema.index({ exitTime: -1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
