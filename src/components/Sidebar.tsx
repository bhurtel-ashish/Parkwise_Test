import { useParking } from '../context/ParkingContext';
import { DashboardIcon, EntryIcon, ExitIcon, SlotsIcon, HistoryIcon, ChevronLeftIcon, ParkingIcon, CloseIcon } from './Icons';
import type { Page } from '../types';

const navItems: { page: Page; label: string; IconComponent: typeof DashboardIcon }[] = [
  { page: 'dashboard', label: 'Dashboard', IconComponent: DashboardIcon },
  { page: 'entry', label: 'Vehicle Entry', IconComponent: EntryIcon },
  { page: 'exit', label: 'Vehicle Exit', IconComponent: ExitIcon },
  { page: 'slots', label: 'Slot Map', IconComponent: SlotsIcon },
  { page: 'history', label: 'Parking History', IconComponent: HistoryIcon },
];

const Sidebar = () => {
  const { currentPage, setCurrentPage, sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useParking();

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setMobileSidebarOpen(false);
  };

  return (
    <>
      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <div className="sidebar-logo" aria-hidden="true">
            <ParkingIcon width={20} height={20} />
          </div>
          <span className="sidebar-title">ParkWise</span>
          {mobileSidebarOpen && (
            <button
              className="slot-popup-close"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
              style={{ marginLeft: 'auto' }}
            >
              <CloseIcon width={18} height={18} />
            </button>
          )}
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ page, label, IconComponent }) => (
            <button
              key={page}
              className={`sidebar-nav-item ${currentPage === page ? 'active' : ''}`}
              onClick={() => handleNavClick(page)}
              aria-label={label}
              aria-current={currentPage === page ? 'page' : undefined}
              title={sidebarCollapsed ? label : undefined}
            >
              <span className="sidebar-nav-icon">
                <IconComponent width={20} height={20} />
              </span>
              <span className="sidebar-nav-label">{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="sidebar-toggle-icon">
              <ChevronLeftIcon width={20} height={20} />
            </span>
            <span className="sidebar-toggle-label">Collapse</span>
          </button>
        </div>
      </aside>
      {mobileSidebarOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setMobileSidebarOpen(false)}
          role="presentation"
        />
      )}
    </>
  );
};

export default Sidebar;
