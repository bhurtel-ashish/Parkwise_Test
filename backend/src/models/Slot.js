import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  slotNumber: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: ['available', 'occupied'], 
    required: true,
    default: 'available'
  },
  vehicleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    default: null 
  },
}, { 
  timestamps: true 
});

// Index for efficient queries
slotSchema.index({ status: 1 });

const Slot = mongoose.model('Slot', slotSchema);

export default Slot;
