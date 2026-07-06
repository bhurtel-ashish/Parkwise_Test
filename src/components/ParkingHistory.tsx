import { useState, useEffect, useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import { formatDateTime, formatDuration, getVehicleTypeEmoji, type Vehicle } from '../types';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

const PER_PAGE = 10;

const ParkingHistory = () => {
  const { vehicles } = useParking();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const historyData = useMemo(() => {
    const filtered = vehicles
      .filter((vehicle) => !vehicle.isParked && vehicle.exitTime)
      .filter((vehicle) => {
        if (!search.trim()) return true;
        const q = search.toUpperCase().trim();
        return (
          vehicle.vehicleNumber.toUpperCase().includes(q) ||
          vehicle.ownerName.toUpperCase().includes(q) ||
          vehicle.slotNumber.toUpperCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.exitTime!).getTime() - new Date(a.exitTime!).getTime());

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * PER_PAGE;
    return {
      vehicles: filtered.slice(start, start + PER_PAGE),
      total,
      totalPages,
      safePage,
    };
  }, [vehicles, page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const getPageNumbers = (): (number | string)[] => {
    const { totalPages } = historyData;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Parking History</h1>
        <p>Complete record of all parking transactions</p>
      </div>

      <div className="history-container">
        <div className="history-controls">
          <div className="history-search">
            <span className="history-search-icon">
              <SearchIcon width={18} height={18} />
            </span>
            <input
              type="text"
              placeholder="Search by vehicle, owner, or slot..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoComplete="off"
              aria-label="Search parking history"
            />
          </div>
          <div className="history-count">
            {historyData.total} record{historyData.total !== 1 ? 's' : ''}
          </div>
        </div>

        {historyData.vehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No parking history</div>
            <div className="empty-state-text">
              Completed parking records will appear here
            </div>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table" role="table">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Type</th>
                    <th scope="col">Slot</th>
                    <th scope="col">Entry Time</th>
                    <th scope="col">Exit Time</th>
                    <th scope="col">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.vehicles.map(vehicle => (
                    <tr key={vehicle._id}>
                      <td className="vehicle-number">{vehicle.vehicleNumber}</td>
                      <td>{vehicle.ownerName}</td>
                      <td>
                        {getVehicleTypeEmoji(vehicle.vehicleType)} {vehicle.vehicleType}
                      </td>
                      <td className="slot-number">{vehicle.slotNumber}</td>
                      <td className="mono">{formatDateTime(vehicle.entryTime)}</td>
                      <td className="mono">
                        {vehicle.exitTime ? formatDateTime(vehicle.exitTime) : '—'}
                      </td>
                      <td>{formatDuration(vehicle.entryTime, vehicle.exitTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {historyData.totalPages > 1 && (
              <div className="pagination" role="navigation" aria-label="Pagination">
                <button
                  className="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon width={16} height={16} />
                </button>
                {getPageNumbers().map((p, i) =>
                  typeof p === 'string' ? (
                    <span key={`ellipsis-${i}`} className="pagination-info">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`pagination-btn ${p === page ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                      aria-label={`Page ${p}`}
                      aria-current={p === page ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  className="pagination-btn"
                  disabled={page >= historyData.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRightIcon width={16} height={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParkingHistory;
