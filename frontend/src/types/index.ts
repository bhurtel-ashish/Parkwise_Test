export type VehicleType = 'Car' | 'Bike' | 'EV';
export type SlotStatus = 'available' | 'occupied';
export type Page = 'dashboard' | 'entry' | 'exit' | 'slots' | 'history';
export type ToastType = 'success' | 'error' | 'info';

export interface Slot {
  slotNumber: string;
  status: SlotStatus;
  vehicleId: string | null;
}

export interface Vehicle {
  _id: string;
  vehicleNumber: string;
  ownerName: string;
  vehicleType: VehicleType;
  slotNumber: string;
  entryTime: string;
  exitTime: string | null;
  isParked: boolean;
}

export interface DashboardStats {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  occupancyPercentage: number;
  todayEntries: number;
  todayExits: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  type: 'entry' | 'exit';
  vehicleNumber: string;
  slotNumber: string;
  time: string;
  ownerName: string;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface EntryData {
  vehicleNumber: string;
  ownerName: string;
  vehicleType: VehicleType;
  slotNumber: string;
}

export interface HistoryResult {
  vehicles: Vehicle[];
  total: number;
  totalPages: number;
}

export const formatDuration = (entryTime: string, exitTime: string | null): string => {
  const end = exitTime ? new Date(exitTime) : new Date();
  const start = new Date(entryTime);
  const diffMs = end.getTime() - start.getTime();

  if (diffMs < 0) return '0m';
  if (diffMs < 60000) return 'Just now';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateTime = (isoString: string): string => {
  return `${formatDate(isoString)}, ${formatTime(isoString)}`;
};

export const getVehicleTypeEmoji = (type: VehicleType): string => {
  switch (type) {
    case 'Car': return '🚗';
    case 'Bike': return '🏍️';
    case 'EV': return '⚡';
    default: return '🚗';
  }
};
