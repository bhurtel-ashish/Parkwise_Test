import type { Slot, Vehicle, DashboardStats, ActivityItem, EntryData, HistoryResult } from '../types';

const SLOTS_KEY = 'parkwise_slots';
const VEHICLES_KEY = 'parkwise_vehicles';
const API_BASE = (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://parkwise-fullstack.onrender.com/api'
  : 'http://localhost:5000/api').replace(/\/$/, '');

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const result = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof result === 'string' ? result : result.message || result.error || 'Request failed';
    throw new Error(message);
  }

  if (!isJson) {
    throw new Error('Unexpected response from backend');
  }

  return result as T;
};

const syncEntryToBackend = async (data: EntryData) => {
  try {
    const response = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Failed to save entry');
    }

    console.log('ParkWise: backend entry saved', result.message);
  } catch (error) {
    console.error('ParkWise: backend entry save failed', error);
  }
};

const syncExitToBackend = async (vehicleNumber: string) => {
  try {
    const response = await fetch(`${API_BASE}/vehicles/${encodeURIComponent(vehicleNumber)}/exit`, {
      method: 'PATCH',
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Failed to exit vehicle');
    }

    console.log('ParkWise: backend exit saved', result.message);
  } catch (error) {
    console.error('ParkWise: backend exit save failed', error);
  }
};

const initializeSlots = (): void => {
  localStorage.removeItem(SLOTS_KEY);
  localStorage.removeItem(VEHICLES_KEY);
  console.log('ParkWise: local cache cleared; live backend data will be used');
};

const getSlots = (): Slot[] => {
  const data = localStorage.getItem(SLOTS_KEY);
  return data ? (JSON.parse(data) as Slot[]) : [];
};

const cacheSlots = (slots: Slot[]): void => {
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
};

const getVehicles = (): Vehicle[] => {
  const data = localStorage.getItem(VEHICLES_KEY);
  return data ? (JSON.parse(data) as Vehicle[]) : [];
};

const cacheVehicles = (vehicles: Vehicle[]): void => {
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
};

const getSlotsFromBackend = async (): Promise<Slot[]> => {
  return requestJson<Slot[]>(`${API_BASE}/slots`);
};

const getVehiclesFromBackend = async (): Promise<Vehicle[]> => {
  return requestJson<Vehicle[]>(`${API_BASE}/vehicles`);
};

const getDashboardStatsFromBackend = async (): Promise<DashboardStats> => {
  return requestJson<DashboardStats>(`${API_BASE}/dashboard`);
};

const getAvailableSlots = (): Slot[] => {
  return getSlots().filter((slot) => slot.status === 'available');
};

const getOccupiedSlots = (): Slot[] => {
  return getSlots().filter((slot) => slot.status === 'occupied');
};

const getActiveVehicle = (vehicleNumber: string): Vehicle | undefined => {
  const upper = vehicleNumber.toUpperCase();
  return getVehicles().find((v) => v.vehicleNumber.toUpperCase() === upper && v.isParked);
};

const getVehicleBySlot = (slotNumber: string): Vehicle | undefined => {
  return getVehicles().find((v) => v.slotNumber === slotNumber && v.isParked);
};

const addVehicle = (data: EntryData): { success: boolean; message: string; vehicle?: Vehicle } => {
  void syncEntryToBackend(data);
  return { success: true, message: `Vehicle ${data.vehicleNumber.toUpperCase().trim()} parked at slot ${data.slotNumber}` };
};

const exitVehicle = (vehicleNumber: string): { success: boolean; message: string; vehicle?: Vehicle } => {
  const upper = vehicleNumber.toUpperCase().trim();
  void syncExitToBackend(upper);
  return { success: true, message: `Vehicle ${upper} exit requested`, vehicle: undefined };
};

const exitBySlot = (slotNumber: string): { success: boolean; message: string; vehicle?: Vehicle } => {
  const vehicle = getVehicleBySlot(slotNumber);
  if (!vehicle) {
    return { success: false, message: `No vehicle found at slot ${slotNumber}` };
  }
  return exitVehicle(vehicle.vehicleNumber);
};

const getDashboardStats = (): DashboardStats => {
  const slots = getSlots();
  const vehicles = getVehicles();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const totalSlots = slots.length;
  const availableSlots = slots.filter((s) => s.status === 'available').length;
  const occupiedSlots = slots.filter((s) => s.status === 'occupied').length;
  const occupancyPercentage = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  const todayEntries = vehicles.filter((v) => v.entryTime >= todayStart).length;
  const todayExits = vehicles.filter((v) => v.exitTime && v.exitTime >= todayStart).length;

  const activities: ActivityItem[] = [];
  vehicles.forEach((v) => {
    if (v.entryTime >= todayStart) {
      activities.push({
        type: 'entry',
        vehicleNumber: v.vehicleNumber,
        slotNumber: v.slotNumber,
        time: v.entryTime,
        ownerName: v.ownerName,
      });
    }
    if (v.exitTime && v.exitTime >= todayStart) {
      activities.push({
        type: 'exit',
        vehicleNumber: v.vehicleNumber,
        slotNumber: v.slotNumber,
        time: v.exitTime,
        ownerName: v.ownerName,
      });
    }
  });

  const recentActivity = activities
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);

  return {
    totalSlots,
    availableSlots,
    occupiedSlots,
    occupancyPercentage,
    todayEntries,
    todayExits,
    recentActivity,
  };
};

const searchVehicles = (query: string): Vehicle[] => {
  if (!query.trim()) return [];
  const q = query.toUpperCase().trim();
  return getVehicles().filter(
    (v) =>
      v.vehicleNumber.toUpperCase().includes(q) ||
      v.slotNumber.toUpperCase().includes(q)
  );
};

const getHistory = (page: number = 1, perPage: number = 10, search: string = ''): HistoryResult => {
  let vehicles = getVehicles().filter((v) => !v.isParked && v.exitTime);
  if (search.trim()) {
    const q = search.toUpperCase().trim();
    vehicles = vehicles.filter(
      (v) =>
        v.vehicleNumber.toUpperCase().includes(q) ||
        v.ownerName.toUpperCase().includes(q) ||
        v.slotNumber.toUpperCase().includes(q)
    );
  }
  vehicles.sort((a, b) => new Date(b.exitTime!).getTime() - new Date(a.exitTime!).getTime());
  const total = vehicles.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  const paginatedVehicles = vehicles.slice(start, start + perPage);
  return { vehicles: paginatedVehicles, total, totalPages };
};

export const parkingService = {
  initializeSlots,
  getSlots,
  cacheSlots,
  getVehicles,
  cacheVehicles,
  getSlotsFromBackend,
  getVehiclesFromBackend,
  getDashboardStatsFromBackend,
  getAvailableSlots,
  getOccupiedSlots,
  getActiveVehicle,
  getVehicleBySlot,
  addVehicle,
  exitVehicle,
  exitBySlot,
  getDashboardStats,
  searchVehicles,
  getHistory,
};
