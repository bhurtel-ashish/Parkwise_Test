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
  const { sidebarCollapsed, exitConfirmation, closeExitConfirmation, exitVehicle, exitBySlot, showToast } = useParking();

  const handleConfirmExit = async (): Promise<boolean> => {
    if (!exitConfirmation.vehicle || !exitConfirmation.identifier) return false;

    let result;
    if (exitConfirmation.exitMethod === 'slot') {
      result = exitBySlot(exitConfirmation.identifier);
    } else {
      result = exitVehicle(exitConfirmation.identifier);
    }

    if (result.success) {
      showToast(result.message, 'success');
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
      {exitConfirmation.isOpen && exitConfirmation.vehicle && (
        <ExitConfirmation
          vehicle={exitConfirmation.vehicle}
          onConfirm={handleConfirmExit}
          onCancel={closeExitConfirmation}
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
