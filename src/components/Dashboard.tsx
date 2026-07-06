import { useParking } from '../context/ParkingContext';
import { formatTime } from '../types';
import { ParkingIcon, CarIcon, UsersIcon, ClockIcon, EntryIcon, ExitIcon } from './Icons';

const getOccupancyStyle = (percentage: number) => {
  if (percentage < 50) {
    return {
      gradient: 'linear-gradient(90deg, #10B981, #34D399)',
      color: 'var(--color-success-text)',
    };
  }
  if (percentage < 80) {
    return {
      gradient: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
      color: 'var(--color-warning-text)',
    };
  }
  return {
    gradient: 'linear-gradient(90deg, #EF4444, #F87171)',
    color: 'var(--color-danger-text)',
  };
};

const Dashboard = () => {
  const { dashboardStats } = useParking();
  const { totalSlots, availableSlots, occupiedSlots, occupancyPercentage, todayEntries, todayExits, recentActivity } = dashboardStats;
  const occupancyStyle = getOccupancyStyle(occupancyPercentage);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Real-time parking overview and statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card--total">
          <div className="stat-card-icon"><ParkingIcon width={22} height={22} /></div>
          <div className="stat-card-value">{totalSlots}</div>
          <div className="stat-card-label">Total Slots</div>
        </div>
        <div className="stat-card stat-card--available">
          <div className="stat-card-icon"><CarIcon width={22} height={22} /></div>
          <div className="stat-card-value">{availableSlots}</div>
          <div className="stat-card-label">Available</div>
        </div>
        <div className="stat-card stat-card--occupied">
          <div className="stat-card-icon"><UsersIcon width={22} height={22} /></div>
          <div className="stat-card-value">{occupiedSlots}</div>
          <div className="stat-card-label">Occupied</div>
        </div>
        <div className="stat-card stat-card--occupancy">
          <div className="stat-card-icon"><ClockIcon width={22} height={22} /></div>
          <div className="stat-card-value">{occupancyPercentage}%</div>
          <div className="stat-card-label">Occupancy</div>
        </div>
        <div className="stat-card stat-card--entries">
          <div className="stat-card-icon"><EntryIcon width={22} height={22} /></div>
          <div className="stat-card-value">{todayEntries}</div>
          <div className="stat-card-label">Today Entries</div>
        </div>
        <div className="stat-card stat-card--exits">
          <div className="stat-card-icon"><ExitIcon width={22} height={22} /></div>
          <div className="stat-card-value">{todayExits}</div>
          <div className="stat-card-label">Today Exits</div>
        </div>
      </div>

      <div className="occupancy-section">
        <div className="occupancy-header">
          <span className="occupancy-title">Occupancy Rate</span>
          <span className="occupancy-value" style={{ color: occupancyStyle.color }}>{occupancyPercentage}%</span>
        </div>
        <div className="occupancy-bar">
          <div className="occupancy-bar-fill" style={{ width: `${occupancyPercentage}%`, background: occupancyStyle.gradient }} />
        </div>
        <div className="occupancy-labels">
          <span>{occupiedSlots} occupied</span>
          <span>{availableSlots} available</span>
        </div>
      </div>

      <div className="activity-section">
        <div className="activity-title">Recent Activity</div>
        {recentActivity.length === 0 ? (
          <div className="activity-empty">No activity today</div>
        ) : (
          <div className="activity-list">
            {recentActivity.map((item, index) => (
              <div key={`${item.type}-${item.vehicleNumber}-${item.time}-${index}`} className="activity-item">
                <div className={`activity-badge activity-badge--${item.type}`}>
                  {item.type === 'entry' ? '↓' : '↑'}
                </div>
                <div className="activity-info">
                  <div className="activity-main">
                    {item.vehicleNumber} — {item.type === 'entry' ? 'Entered' : 'Exited'}
                  </div>
                  <div className="activity-sub">Slot {item.slotNumber} • {item.ownerName}</div>
                </div>
                <div className="activity-time">{formatTime(item.time)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
