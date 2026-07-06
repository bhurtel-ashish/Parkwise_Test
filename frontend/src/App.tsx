import { ParkingProvider, useParking } from './context/ParkingContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import VehicleEntry from './components/VehicleEntry';
import VehicleExit from './components/VehicleExit';
import SlotMap from './components/SlotMap';
import ParkingHistory from './components/ParkingHistory';
import ToastContainer from './components/Toast';
import ExitConfirmation from './components/ExitConfirmation';

const PageRenderer = () => {
  const { currentPage } = useParking();

  switch (currentPage) {
    case 'dashboard':
      return <Dashboard />;
    case 'entry':
      return <VehicleEntry />;
    case 'exit':
      return <VehicleExit />;
    case 'slots':
      return <SlotMap />;
    case 'history':
      return <ParkingHistory />;
    default:
      return <Dashboard />;
  }
};

const AppLayout = () => {
  const {
    sidebarCollapsed,
    exitConfirmation,
    closeExitConfirmation,
    exitVehicle,
    exitBySlot,
    showToast,
    backendAvailable,
    backendMessage,
  } = useParking();

  const handleConfirmExit = async (): Promise<boolean> => {
    if (!exitConfirmation.vehicle || !exitConfirmation.identifier) return false;

    let result;
    if (exitConfirmation.exitMethod === 'slot') {
      result = exitBySlot(exitConfirmation.identifier);
    } else {
      result = exitVehicle(exitConfirmation.vehicle.vehicleNumber);
    }

    if (result.success) {
      closeExitConfirmation();
      return true;
    } else {
      showToast(result.message, 'error');
      return false;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar />
        {!backendAvailable && backendMessage && (
          <div
            role="status"
            style={{
              margin: '12px 16px 0',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#fff3cd',
              color: '#856404',
              border: '1px solid #ffeeba',
            }}
          >
            {backendMessage}
          </div>
        )}
        <main className="main-content" role="main">
          <PageRenderer />
        </main>
      </div>
      <ToastContainer />
      {exitConfirmation.isOpen && exitConfirmation.vehicle && (
        <ExitConfirmation
          vehicle={exitConfirmation.vehicle}
          onCancel={closeExitConfirmation}
          onConfirm={handleConfirmExit}
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <ParkingProvider>
      <AppLayout />
    </ParkingProvider>
  );
};

export default App;
