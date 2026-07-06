import { ParkingProvider, useParking } from '../../src/context/ParkingContext';
import Sidebar from '../../src/components/Sidebar';
import Navbar from '../../src/components/Navbar';
import Dashboard from '../../src/components/Dashboard';
import VehicleEntry from '../../src/components/VehicleEntry';
import VehicleExit from '../../src/components/VehicleExit';
import SlotMap from '../../src/components/SlotMap';
import ParkingHistory from '../../src/components/ParkingHistory';
import ToastContainer from '../../src/components/Toast';
import ExitConfirmation from '../../src/components/ExitConfirmation';

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
  const { sidebarCollapsed, exitConfirmation, closeExitConfirmation, exitVehicle, exitBySlot, showToast } = useParking();

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
        <main className="main-content" role="main">
          <PageRenderer />
        </main>
      </div>
      <ToastContainer />
      {exitConfirmation.isOpen && (
        <ExitConfirmation
          vehicle={exitConfirmation.vehicle}
          onClose={closeExitConfirmation}
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
