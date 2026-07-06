/**
 * ParkWise - MongoDB Database Seeder
 * 
 * This script populates the MongoDB database with realistic sample data
 * for demonstration and testing purposes.
 * 
 * Usage:
 *   npm run seed              # Fixed demo mode (same data every time)
 *   npm run seed:random       # Random demo mode (different data each time)
 *   npm run seed:clear        # Clear all demo data
 * 
 * Environment Variables Required:
 *   MONGODB_URI - MongoDB Atlas connection string
 */

const mongoose = require('mongoose');

// MongoDB connection URI from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ParkWise_data';

// ============================================
// Mongoose Models
// ============================================

const slotSchema = new mongoose.Schema({
  slotNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['available', 'occupied'], required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
}, { timestamps: true });

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, index: true },
  ownerName: { type: String, required: true },
  vehicleType: { type: String, enum: ['Car', 'Bike', 'EV'], required: true },
  slotNumber: { type: String, required: true },
  entryTime: { type: Date, required: true },
  exitTime: { type: Date, default: null },
  isParked: { type: Boolean, required: true, default: true },
}, { timestamps: true });

const Slot = mongoose.model('Slot', slotSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// ============================================
// Sample Data Generators
// ============================================

const DEFAULT_SLOT_NUMBERS = [
  'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09',
  'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09',
  'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09',
];

const VEHICLE_NUMBER_PATTERNS = [
  { prefix: 'BA', range: [1, 20] },
  { prefix: 'GA', range: [1, 10] },
  { prefix: 'LU', range: [1, 15] },
  { prefix: 'KO', range: [1, 12] },
  { prefix: 'KA', range: [1, 18] },
];

const OWNER_NAMES = [
  'Ram Sharma', 'Sita Karki', 'Aayush Thapa', 'Nabin Gurung',
  'Anisha Rai', 'Prakash KC', 'Sunita Magar', 'Bikash Tamang',
  'Priya Shrestha', 'Rohan Maharjan', 'Kavita Adhikari', 'Sagar Bhatta',
  'Meera Poudel', 'Amit Basnet', 'Ritu Dhakal', 'Manish Neupane',
  'Jyoti Koirala', 'Sandeep Aryal', 'Nisha Pandey', 'Rajesh Malla',
  'Anjali Regmi', 'Deepak Sapkota', 'Pooja Ghimire', 'Kiran Baral',
];

const VEHICLE_TYPES = ['Car', 'Bike', 'EV'];

const generateVehicleNumber = (index, random = false) => {
  const pattern = VEHICLE_NUMBER_PATTERNS[index % VEHICLE_NUMBER_PATTERNS.length];
  const districtCode = random
    ? Math.floor(Math.random() * (pattern.range[1] - pattern.range[0] + 1)) + pattern.range[0]
    : pattern.range[0] + (index % (pattern.range[1] - pattern.range[0] + 1));
  const typeCode = ['PA', 'CHA', 'BA', 'SA'][random ? Math.floor(Math.random() * 4) : index % 4];
  const number = random ? Math.floor(Math.random() * 9000) + 1000 : 1000 + index * 100;
  return `${pattern.prefix}${districtCode.toString().padStart(2, '0')}${typeCode}${number}`;
};

const getRandomOwnerName = (index, random = false) => {
  return random ? OWNER_NAMES[Math.floor(Math.random() * OWNER_NAMES.length)] : OWNER_NAMES[index % OWNER_NAMES.length];
};

const getRandomVehicleType = (index, random = false) => {
  if (!random) return VEHICLE_TYPES[index % VEHICLE_TYPES.length];
  const rand = Math.random();
  if (rand < 0.6) return 'Car';
  if (rand < 0.85) return 'Bike';
  return 'EV';
};

const generateEntryTime = (hoursAgo) => {
  const now = new Date();
  const entryTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  entryTime.setMinutes(entryTime.getMinutes() - Math.floor(Math.random() * 30));
  return entryTime;
};

const generateExitTime = (entryTime, durationHours) => {
  const exitTime = new Date(entryTime.getTime() + durationHours * 60 * 60 * 1000);
  exitTime.setMinutes(exitTime.getMinutes() + Math.floor(Math.random() * 30));
  return exitTime;
};

const generatePastDate = (daysAgo, hourRange) => {
  const now = new Date();
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const hour = Math.floor(Math.random() * (hourRange[1] - hourRange[0] + 1)) + hourRange[0];
  const minute = Math.floor(Math.random() * 60);
  date.setHours(hour, minute, 0, 0);
  return date;
};

// ============================================
// Seed Functions
// ============================================

async function seedDatabase(options = {}) {
  const {
    mode = 'fixed', // 'fixed' or 'random'
    activeVehicles = 12,
    historicalRecords = 24,
    clearExisting = true,
  } = options;

  const isRandom = mode === 'random';

  console.log('\n🌱 ParkWise Database Seeder');
  console.log('================================');
  console.log(`Mode: ${isRandom ? 'Random' : 'Fixed (Demo)'}`);
  console.log(`Active Vehicles: ${activeVehicles}`);
  console.log(`Historical Records: ${historicalRecords}`);
  console.log('================================\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data if requested
    if (clearExisting) {
      await Slot.deleteMany({});
      await Vehicle.deleteMany({});
      console.log('✓ Cleared existing demo data');
    }

    // Create parking slots
    const slots = DEFAULT_SLOT_NUMBERS.map(slotNumber => ({
      slotNumber,
      status: 'available',
      vehicleId: null,
    }));

    await Slot.insertMany(slots);
    console.log(`✓ Created ${slots.length} parking slots`);

    // Select random slots for active vehicles
    const shuffledSlots = [...DEFAULT_SLOT_NUMBERS].sort(() => Math.random() - 0.5);
    const occupiedSlotNumbers = shuffledSlots.slice(0, activeVehicles);

    // Create active vehicles
    const activeVehiclesData = [];
    const entryTimePatterns = [0.25, 0.75, 1.5, 2, 3, 4, 5, 6, 7, 8, 10, 12];

    for (let i = 0; i < occupiedSlotNumbers.length; i++) {
      const slotNumber = occupiedSlotNumbers[i];
      const vehicleNumber = generateVehicleNumber(i, isRandom);
      const ownerName = getRandomOwnerName(i, isRandom);
      const vehicleType = getRandomVehicleType(i, isRandom);
      const hoursAgo = entryTimePatterns[i % entryTimePatterns.length];
      const entryTime = generateEntryTime(hoursAgo);

      const vehicle = new Vehicle({
        vehicleNumber,
        ownerName,
        vehicleType,
        slotNumber,
        entryTime,
        exitTime: null,
        isParked: true,
      });

      activeVehiclesData.push(vehicle);

      // Mark slot as occupied
      const slot = await Slot.findOne({ slotNumber });
      if (slot) {
        slot.status = 'occupied';
        slot.vehicleId = vehicle._id;
        await slot.save();
      }
    }

    await Vehicle.insertMany(activeVehiclesData);
    console.log(`✓ Created ${activeVehiclesData.length} active vehicles`);

    // Create historical records
    const historicalVehiclesData = [];
    const historicalSlotNumbers = [...DEFAULT_SLOT_NUMBERS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < historicalRecords; i++) {
      const daysAgo = Math.floor(i / 6);
      const entryHourRange = [6, 20];
      const entryTime = generatePastDate(daysAgo, entryHourRange);
      const durationHours = 1 + Math.random() * 8;
      const exitTime = generateExitTime(entryTime, durationHours);

      const vehicleNumber = generateVehicleNumber(i + 100, isRandom);
      const ownerName = getRandomOwnerName(i, isRandom);
      const vehicleType = getRandomVehicleType(i, isRandom);
      const slotNumber = historicalSlotNumbers[i % historicalSlotNumbers.length];

      const vehicle = new Vehicle({
        vehicleNumber,
        ownerName,
        vehicleType,
        slotNumber,
        entryTime,
        exitTime,
        isParked: false,
      });

      historicalVehiclesData.push(vehicle);
    }

    await Vehicle.insertMany(historicalVehiclesData);
    console.log(`✓ Created ${historicalVehiclesData.length} historical records`);

    // Print summary
    const totalSlots = await Slot.countDocuments();
    const occupiedSlots = await Slot.countDocuments({ status: 'occupied' });
    const availableSlots = await Slot.countDocuments({ status: 'available' });
    const activeCount = await Vehicle.countDocuments({ isParked: true });
    const historicalCount = await Vehicle.countDocuments({ isParked: false });

    console.log('\n================================');
    console.log('📊 Database Seed Complete');
    console.log('================================');
    console.log(`✓ ${totalSlots} Parking Slots Created`);
    console.log(`✓ ${occupiedSlots} Occupied Slots`);
    console.log(`✓ ${availableSlots} Available Slots`);
    console.log(`✓ ${activeCount} Active Vehicles`);
    console.log(`✓ ${historicalCount} Historical Records`);
    console.log('================================\n');
    console.log('🎉 Demo data is ready for presentation!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

async function clearDatabase() {
  console.log('\n🗑️  Clearing ParkWise Database...\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const slotsDeleted = await Slot.deleteMany({});
    const vehiclesDeleted = await Vehicle.deleteMany({});

    console.log('\n================================');
    console.log('📊 Database Cleared');
    console.log('================================');
    console.log(`✓ Deleted ${slotsDeleted.deletedCount} slots`);
    console.log(`✓ Deleted ${vehiclesDeleted.deletedCount} vehicles`);
    console.log('================================\n');

  } catch (error) {
    console.error('❌ Clear failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

// ============================================
// CLI Execution
// ============================================

const command = process.argv[2];

switch (command) {
  case 'random':
    seedDatabase({ mode: 'random' });
    break;
  case 'clear':
    clearDatabase();
    break;
  case 'help':
  default:
    console.log('\nParkWise Database Seeder');
    console.log('========================\n');
    console.log('Usage:');
    console.log('  node seedDatabase.js         # Fixed demo mode');
    console.log('  node seedDatabase.js random  # Random demo mode');
    console.log('  node seedDatabase.js clear   # Clear all data');
    console.log('  node seedDatabase.js help    # Show this help\n');
    console.log('Environment Variables:');
    console.log('  MONGODB_URI  - MongoDB connection string\n');
    break;
}
