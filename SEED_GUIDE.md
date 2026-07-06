# ParkWise Database Seeding Guide

This guide explains how to use the database seeding system to populate ParkWise with realistic demo data.

## Overview

The seeding system provides two modes:

1. **Frontend Seeder** (`src/utils/seedData.ts`) - Uses localStorage for the frontend-only deployment
2. **MongoDB Seeder** (`server/seed/seedDatabase.js`) - Uses MongoDB for full-stack deployment

Both generate identical data structures with realistic parking facility information.

---

## Frontend Seeder (localStorage)

### Using the Demo Data Manager UI

The easiest way to seed data is through the built-in Demo Data Manager widget:

1. **Open ParkWise** in your browser
2. **Locate the widget** in the bottom-right corner (🌱 icon)
3. **Select a mode**:
   - **Fixed (Demo)**: Same dataset every time - perfect for presentations
   - **Random**: Different data each time - great for testing
4. **Click "Load Demo Data"** to populate the database
5. **View the results** on the Dashboard and Slot Map

### Programmatic Usage

```typescript
import { seedDatabase, clearDatabase, getSeedStatus } from './utils/seedData';

// Seed with default options (fixed mode)
const summary = seedDatabase();

// Seed with custom options
const summary = seedDatabase({
  mode: 'random',           // 'fixed' or 'random'
  activeVehicles: 15,       // Number of currently parked vehicles
  historicalRecords: 30,    // Number of completed parking sessions
  clearExisting: true,      // Clear data before seeding
});

// Check if database has been seeded
const isSeeded = isDatabaseSeeded();

// Get current database status
const status = getSeedStatus();
console.log(status);
// {
//   isSeeded: true,
//   totalSlots: 27,
//   totalVehicles: 36,
//   activeVehicles: 12,
//   historicalRecords: 24
// }

// Clear all data
clearDatabase();
```

### Data Generated

**Parking Slots (27 total)**
```
Row A: A01, A02, A03, A04, A05, A06, A07, A08, A09
Row B: B01, B02, B03, B04, B05, B06, B07, B08, B09
Row C: C01, C02, C03, C04, C05, C06, C07, C08, C09
```

**Active Vehicles (12 default)**
- Realistic vehicle numbers (e.g., BA02PA4587, GA01PA9087)
- Varied owner names (e.g., Ram Sharma, Sita Karki)
- Mixed vehicle types (60% Car, 25% Bike, 15% EV)
- Entry times ranging from 15 minutes to 12 hours ago
- Slots distributed naturally (not clustered)

**Historical Records (24 default)**
- Completed parking sessions from past 1-5 days
- Realistic durations (1-9 hours)
- Varied entry/exit times throughout business hours

---

## MongoDB Seeder (Full-Stack)

### Prerequisites

1. MongoDB Atlas account or local MongoDB installation
2. Node.js 18+ installed
3. Mongoose package: `npm install mongoose`

### Setup

```bash
# Set environment variable
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/parkwise"

# Or create .env file
cp .env.example .env
# Edit .env with your connection string
```

### Running the Seeder

```bash
# Fixed demo mode (recommended for presentations)
node server/seed/seedDatabase.js

# Random demo mode (for testing)
node server/seed/seedDatabase.js random

# Clear all demo data
node server/seed/seedDatabase.js clear

# Show help
node server/seed/seedDatabase.js help
```

### Expected Output

```
🌱 ParkWise Database Seeder
================================
Mode: Fixed (Demo)
Active Vehicles: 12
Historical Records: 24
================================

✓ Connected to MongoDB
✓ Cleared existing demo data
✓ Created 27 parking slots
✓ Created 12 active vehicles
✓ Created 24 historical records

================================
📊 Database Seed Complete
================================
✓ 27 Parking Slots Created
✓ 12 Occupied Slots
✓ 15 Available Slots
✓ 12 Active Vehicles
✓ 24 Historical Records
================================

🎉 Demo data is ready for presentation!

✓ Database connection closed
```

### Verification

After seeding, verify the data through the API:

```bash
# Check dashboard stats
curl http://localhost:5000/api/dashboard

# Check slots
curl http://localhost:5000/api/slots

# Check active vehicles
curl http://localhost:5000/api/vehicle/search?query=BA
```

---

## Data Quality

### Realistic Patterns

The seeder generates believable data:

**Vehicle Numbers**
- Regional prefixes (BA=Bagmati, GA=Gandaki, LU=Lumbini, etc.)
- District codes (01-20)
- Type codes (PA=Private, CHA=Commercial, etc.)
- Sequential numbers (1000-9999)

**Owner Names**
- Common Nepali names
- Varied surnames (Sharma, Karki, Thapa, Gurung, etc.)
- No sequential patterns (not User1, User2)

**Timestamps**
- Entry times spread throughout the day
- Realistic parking durations (15 min to 12 hours for active)
- Historical records from multiple days
- No identical timestamps

**Slot Distribution**
- Occupied slots scattered naturally
- No clustering in one area
- Mix of available and occupied in each row

---

## Best Practices

### For Presentations

1. Use **Fixed mode** for consistent demo data
2. Seed before starting your presentation
3. Verify dashboard shows expected statistics
4. Test vehicle entry/exit flows

### For Testing

1. Use **Random mode** to test edge cases
2. Clear and re-seed between test sessions
3. Test with different vehicle counts
4. Verify search functionality with varied data

### For Development

1. Seed once at project start
2. Use Clear when testing data integrity
3. Keep historical records for pagination tests
4. Test real-time updates with seeded data

---

## Troubleshooting

### Frontend Seeder Issues

**Problem**: Demo data not appearing
- **Solution**: Refresh the page, check browser console for errors

**Problem**: Widget not visible
- **Solution**: Check bottom-right corner, may be hidden by other UI elements

**Problem**: Data appears corrupted
- **Solution**: Click "Clear" then "Load Demo Data" again

### MongoDB Seeder Issues

**Problem**: Connection failed
- **Solution**: Verify MONGODB_URI is correct, check network access

**Problem**: Duplicate key error
- **Solution**: Run with `clear` option first: `node seedDatabase.js clear`

**Problem**: No data appears after seeding
- **Solution**: Verify collection names match, check database name in URI

---

## Customization

### Modifying Sample Data

Edit the arrays in `seedData.ts` or `seedDatabase.js`:

```javascript
// Add more owner names
const OWNER_NAMES = [
  'Existing Name',
  'New Owner Name',  // Add here
  // ...
];

// Adjust vehicle type distribution
const getRandomVehicleType = () => {
  const rand = Math.random();
  if (rand < 0.7) return 'Car';      // 70% cars
  if (rand < 0.9) return 'Bike';     // 20% bikes
  return 'EV';                        // 10% EVs
};
```

### Changing Default Counts

```javascript
// Frontend
seedDatabase({
  activeVehicles: 20,       // More active vehicles
  historicalRecords: 50,    // More history
});

// MongoDB
// Edit seedDatabase.js defaults
const options = {
  activeVehicles: 20,
  historicalRecords: 50,
};
```

---

## Safety Notes

⚠️ **The seeder will overwrite existing data**

- Always backup important data before seeding
- Use `clearExisting: true` only when you want to replace all data
- The seeder never runs automatically - only on explicit command

⚠️ **Demo data is for demonstration only**

- Do not use in production environments
- Remove before deploying to real users
- Contains fictional names and vehicle numbers

---

## Support

For issues with the seeding system:

1. Check the console output for error messages
2. Verify environment variables are set correctly
3. Ensure MongoDB connection is working (for full-stack)
4. Clear browser cache (for frontend)
5. Open an issue on GitHub with details
