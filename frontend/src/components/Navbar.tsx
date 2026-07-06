import { useParking } from '../context/ParkingContext';
import { MenuIcon, SunIcon, MoonIcon } from './Icons';
import type { Page } from '../types';

const pageTitles: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Real-time parking overview' },
  entry: { title: 'Vehicle Entry', subtitle: 'Register incoming vehicles' },
  exit: { title: 'Vehicle Exit', subtitle: 'Process vehicle departures and search' },
  slots: { title: 'Slot Map', subtitle: 'Visual parking layout' },
  history: { title: 'Parking History', subtitle: 'Complete parking records' },
};

const Navbar = () => {
  const { currentPage, theme, toggleTheme, sidebarCollapsed, setMobileSidebarOpen } = useParking();
  const pageInfo = pageTitles[currentPage];

  return (
    <header
      className={`navbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      role="banner"
    >
      <div className="navbar-left">
        <button
          className="navbar-hamburger"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <MenuIcon width={22} height={22} />
        </button>
        <div>
          <span className="navbar-title">{pageInfo.title}</span>
          <span className="navbar-subtitle">{pageInfo.subtitle}</span>
        </div>
      </div>
      <div className="navbar-right">
        <div className="navbar-status">
          <span className="navbar-status-dot" />
          Live
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <SunIcon width={20} height={20} /> : <MoonIcon width={20} height={20} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
