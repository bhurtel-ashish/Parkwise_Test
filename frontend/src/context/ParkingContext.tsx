import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Slot, Vehicle, Page, Toast, ToastType, EntryData, DashboardStats, HistoryResult } from '../types';
import { parkingService } from '../services/parkingService';

interface ExitConfirmationState {
  isOpen: boolean;
  vehicle: Vehicle | null;
  exitMethod: 'vehicle' | 'slot' | null;
  identifier: string | null;
}

interface ParkingContextType {
  slots: Slot[];
  vehicles: Vehicle[];
  dashboardStats: DashboardStats;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  preselectedSlot: string | null;
  setPreselectedSlot: (slot: string | null) => void;
  navigateToEntry: (slot?: string | null) => void;
  addVehicle: (data: EntryData) => { success: boolean; message: string };
  exitVehicle: (vehicleNumber: string) => { success: boolean; message: string };
  exitBySlot: (slotNumber: string) => { success: boolean; message: string };
  refreshData: () => void;
  backendAvailable: boolean;
  backendMessage: string | null;
  toasts: Toast[];
  showToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  getHistory: (page: number, perPage: number, search: string) => HistoryResult;
  searchVehicles: (query: string) => Vehicle[];
  exitConfirmation: ExitConfirmationState;
  requestExitConfirmation: (vehicle: Vehicle, method?: 'vehicle' | 'slot', identifier?: string) => void;
  closeExitConfirmation: () => void;
}

const ParkingContext = createContext<ParkingContextType | null>(null);

export const useParking = (): ParkingContextType => {
  const ctx = useContext(ParkingContext);
  if (!ctx) throw new Error('useParking must be used within ParkingProvider');
  return ctx;
};

const generateToastId = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const ParkingProvider = ({ children }: { children: ReactNode }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSlots: 0, availableSlots: 0, occupiedSlots: 0,
    occupancyPercentage: 0, todayEntries: 0, todayExits: 0, recentActivity: [],
  });
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('parkwise_theme');
    if (saved) return saved as 'light' | 'dark';
    return 'light';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('parkwise_sidebar_collapsed');
    return saved === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [preselectedSlot, setPreselectedSlot] = useState<string | null>(null);
  const [exitConfirmation, setExitConfirmation] = useState<ExitConfirmationState>({
    isOpen: false,
    vehicle: null,
    exitMethod: null,
    identifier: null,
  });

  const navigateToEntry = useCallback((slot?: string | null) => {
    setPreselectedSlot(slot ?? null);
    setCurrentPage('entry');
  }, [setCurrentPage]);

  const refreshData = useCallback(async () => {
    try {
      const [slotsData, vehiclesData, statsData] = await Promise.all([
        parkingService.getSlotsFromBackend(),
        parkingService.getVehiclesFromBackend(),
        parkingService.getDashboardStatsFromBackend(),
      ]);
      parkingService.cacheSlots(slotsData);
      parkingService.cacheVehicles(vehiclesData);
      setSlots(slotsData);
      setVehicles(vehiclesData);
      setDashboardStats(statsData);
      setBackendAvailable(true);
      setBackendMessage(null);
    } catch (error) {
      console.error('ParkWise: failed to refresh data from backend', error);
      setSlots(parkingService.getSlots());
      setVehicles(parkingService.getVehicles());
      setDashboardStats(parkingService.getDashboardStats());
      setBackendAvailable(false);
      setBackendMessage('Backend unavailable. Showing cached data until the connection is restored.');
    }
  }, []);

  useEffect(() => {
    parkingService.initializeSlots();
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('parkwise_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('parkwise_sidebar_collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? 'https://parkwise-fullstack.onrender.com'
      : 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-parking');
    });

    socket.on('parking-update', () => {
      void refreshData();
    });

    socket.on('connect_error', (error) => {
      console.warn('ParkWise: socket connection error', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [refreshData]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('parkwise_')) {
        void refreshData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshData]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshData();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [refreshData]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = generateToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addVehicle = useCallback((data: EntryData) => {
    const result = parkingService.addVehicle(data);
    if (result.success) {
      void refreshData();
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
    return result;
  }, [refreshData, showToast]);

  const exitVehicle = useCallback((vehicleNumber: string) => {
    const result = parkingService.exitVehicle(vehicleNumber);
    if (result.success) {
      void refreshData();
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
    return result;
  }, [refreshData, showToast]);

  const exitBySlot = useCallback((slotNumber: string) => {
    const result = parkingService.exitBySlot(slotNumber);
    if (result.success) {
      void refreshData();
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
    return result;
  }, [refreshData, showToast]);

  const getHistory = useCallback((page: number, perPage: number, search: string) => {
    return parkingService.getHistory(page, perPage, search);
  }, []);

  const searchVehicles = useCallback((query: string) => {
    return parkingService.searchVehicles(query);
  }, []);

  const requestExitConfirmation = useCallback((
    vehicle: Vehicle,
    method: 'vehicle' | 'slot' = 'vehicle',
    identifier: string = vehicle.vehicleNumber
  ) => {
    setExitConfirmation({
      isOpen: true,
      vehicle,
      exitMethod: method,
      identifier,
    });
  }, []);

  const closeExitConfirmation = useCallback(() => {
    setExitConfirmation({
      isOpen: false,
      vehicle: null,
      exitMethod: null,
      identifier: null,
    });
  }, []);

  const value: ParkingContextType = {
    slots, vehicles, dashboardStats,
    currentPage, setCurrentPage,
    theme, toggleTheme,
    sidebarCollapsed, toggleSidebar,
    mobileSidebarOpen, setMobileSidebarOpen,
    preselectedSlot, setPreselectedSlot,
    navigateToEntry,
    addVehicle, exitVehicle, exitBySlot,
    refreshData,
    backendAvailable,
    backendMessage,
    toasts, showToast, removeToast,
    getHistory, searchVehicles,
    exitConfirmation,
    requestExitConfirmation,
    closeExitConfirmation,
  };

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>;
};
