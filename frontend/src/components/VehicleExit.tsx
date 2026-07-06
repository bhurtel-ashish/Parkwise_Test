import { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import { formatTime, formatDuration, formatDateTime, getVehicleTypeEmoji } from '../types';
import { SearchIcon, ExitIcon } from './Icons';

type SearchTab = 'exit' | 'search';

const VehicleExit = () => {
  const { slots, vehicles, requestExitConfirmation, searchVehicles } = useParking();
  const [searchTab, setSearchTab] = useState<SearchTab>('exit');
  const [searchNumber, setSearchNumber] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<typeof vehicles[0] | null>(null);
  const [searchError, setSearchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof vehicles>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const occupiedSlots = slots.filter(s => s.status === 'occupied');
  const occupiedVehicles = vehicles.filter(v => v.isParked);

  const handleExitSearch = () => {
    if (!searchNumber.trim()) {
      setSearchError('Please enter a vehicle number');
      return;
    }
    const found = occupiedVehicles.find(
      v => v.vehicleNumber.toUpperCase() === searchNumber.toUpperCase().trim()
    );
    if (found) {
      setSelectedVehicle(found);
      setSearchError('');
    } else {
      setSearchError('No active vehicle found with that number');
      setSelectedVehicle(null);
    }
  };

  const handleSlotSelect = (slotNumber: string) => {
    const found = occupiedVehicles.find(v => v.slotNumber === slotNumber);
    if (found) {
      setSelectedVehicle(found);
      setSearchNumber(found.vehicleNumber);
      setSearchError('');
    }
  };

  const handleExit = () => {
    if (!selectedVehicle) return;
    requestExitConfirmation(selectedVehicle, 'vehicle', selectedVehicle.vehicleNumber);
  };

  const handleExitBySlot = (slotNumber: string) => {
    const vehicle = occupiedVehicles.find(v => v.slotNumber === slotNumber);
    if (vehicle) {
      requestExitConfirmation(vehicle, 'slot', slotNumber);
    }
  };

  const handleCancel = () => {
    setSelectedVehicle(null);
    setSearchNumber('');
    setSearchError('');
  };

  const handleVehicleSearch = () => {
    if (!searchQuery.trim()) return;
    const results = searchVehicles(searchQuery.trim());
    setSearchResults(results);
    setHasSearched(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Vehicle Exit</h1>
        <p>Process vehicle departures and search vehicle records</p>
      </div>

      {/* Search Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          className={`btn ${searchTab === 'exit' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setSearchTab('exit');
            setSelectedVehicle(null);
            setSearchNumber('');
            setSearchError('');
          }}
        >
          <ExitIcon width={18} height={18} />
          Vehicle Exit
        </button>
        <button
          className={`btn ${searchTab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setSearchTab('search');
            setSearchQuery('');
            setSearchResults([]);
            setHasSearched(false);
          }}
        >
          <SearchIcon width={18} height={18} />
          Vehicle Search
        </button>
      </div>

      {searchTab === 'exit' ? (
        <>
          <div className="exit-container">
            <div className="exit-form-section">
              <div className="exit-form-title">Search by Vehicle Number</div>
              <div className="form-group">
                <input
                  type="text"
                  className={`form-input ${searchError ? 'error' : ''}`}
                  value={searchNumber}
                  onChange={(e) => {
                    setSearchNumber(e.target.value);
                    setSearchError('');
                  }}
                  placeholder="Enter vehicle number"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleExitSearch(); }}
                  autoComplete="off"
                  aria-label="Vehicle number search"
                />
                {searchError && <div className="form-error">{searchError}</div>}
              </div>
              <button className="btn btn-primary" onClick={handleExitSearch}>
                <SearchIcon width={18} height={18} />
                Search
              </button>
            </div>

            <div className="exit-slots-section">
              <div className="exit-slots-title">Or Select an Occupied Slot</div>
              {occupiedSlots.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                  <div className="empty-state-icon">🅿️</div>
                  <div className="empty-state-text">No occupied slots right now</div>
                </div>
              ) : (
                <div className="exit-slots-list">
                  {occupiedSlots.map(slot => {
                    const vehicle = occupiedVehicles.find(v => v.slotNumber === slot.slotNumber);
                    return (
                      <div
                        key={slot.slotNumber}
                        className={`exit-slot-item ${selectedVehicle?.slotNumber === slot.slotNumber ? 'selected' : ''}`}
                        onClick={() => handleSlotSelect(slot.slotNumber)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSlotSelect(slot.slotNumber); }}
                      >
                        <div className="exit-slot-info">
                          <span className="exit-slot-number">{slot.slotNumber}</span>
                          <span className="exit-slot-vehicle">{vehicle?.vehicleNumber}</span>
                          <span className="exit-slot-owner">{vehicle?.ownerName}</span>
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExitBySlot(slot.slotNumber);
                          }}
                        >
                          Exit
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {selectedVehicle && (
            <div className="exit-detail-card">
              <div className="exit-detail-title">Vehicle Details</div>
              <div className="exit-detail-rows">
                <div className="exit-detail-row">
                  <span className="exit-detail-label">Vehicle Number</span>
                  <span className="exit-detail-value">{selectedVehicle.vehicleNumber}</span>
                </div>
                <div className="exit-detail-row">
                  <span className="exit-detail-label">Owner Name</span>
                  <span className="exit-detail-value">{selectedVehicle.ownerName}</span>
                </div>
                <div className="exit-detail-row">
                  <span className="exit-detail-label">Vehicle Type</span>
                  <span className="exit-detail-value">
                    {getVehicleTypeEmoji(selectedVehicle.vehicleType)} {selectedVehicle.vehicleType}
                  </span>
                </div>
                <div className="exit-detail-row">
                  <span className="exit-detail-label">Slot Number</span>
                  <span className="exit-detail-value">{selectedVehicle.slotNumber}</span>
                </div>
                <div className="exit-detail-row">
                  <span className="exit-detail-label">Entry Time</span>
                  <span className="exit-detail-value">{formatTime(selectedVehicle.entryTime)}</span>
                </div>
                <div className="exit-detail-row">
                  <span className="exit-detail-label">Parking Duration</span>
                  <span className="exit-detail-value">{formatDuration(selectedVehicle.entryTime, null)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn btn-danger" onClick={handleExit}>
                  <ExitIcon width={18} height={18} />
                  Process Exit
                </button>
                <button className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="search-container">
            <div className="search-input-wrapper">
              <span className="search-input-icon"><SearchIcon width={20} height={20} /></span>
              <input
                type="text"
                className="search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (hasSearched) setHasSearched(false);
                }}
                placeholder="Search by vehicle number or slot number..."
                onKeyDown={(e) => { if (e.key === 'Enter') handleVehicleSearch(); }}
                autoComplete="off"
                aria-label="Vehicle search"
              />
            </div>

            {!hasSearched && searchQuery.trim() === '' && (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">Search Vehicles</div>
                <div className="empty-state-text">
                  Enter a vehicle number or slot number to find parking records
                </div>
              </div>
            )}

            {hasSearched && searchResults.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🤷</div>
                <div className="empty-state-title">No results found</div>
                <div className="empty-state-text">
                  Try searching with a different vehicle number or slot number
                </div>
              </div>
            )}

            <div className="search-results">
              {searchResults.map(vehicle => (
                <div key={vehicle._id} className="search-result-card">
                  <div className="search-result-header">
                    <div className="search-result-vehicle">
                      {getVehicleTypeEmoji(vehicle.vehicleType)} {vehicle.vehicleNumber}
                    </div>
                    <span className={`search-result-status ${vehicle.isParked ? 'parked' : 'exited'}`}>
                      {vehicle.isParked ? 'Parked' : 'Exited'}
                    </span>
                  </div>
                  <div className="search-result-details">
                    <div className="search-result-field">
                      <span className="search-result-field-label">Owner</span>
                      <span className="search-result-field-value">{vehicle.ownerName}</span>
                    </div>
                    <div className="search-result-field">
                      <span className="search-result-field-label">Slot</span>
                      <span className="search-result-field-value">{vehicle.slotNumber}</span>
                    </div>
                    <div className="search-result-field">
                      <span className="search-result-field-label">Entry Time</span>
                      <span className="search-result-field-value">{formatDateTime(vehicle.entryTime)}</span>
                    </div>
                    <div className="search-result-field">
                      <span className="search-result-field-label">Exit Time</span>
                      <span className="search-result-field-value">
                        {vehicle.exitTime ? formatDateTime(vehicle.exitTime) : '—'}
                      </span>
                    </div>
                    <div className="search-result-field">
                      <span className="search-result-field-label">Duration</span>
                      <span className="search-result-field-value">
                        {formatDuration(vehicle.entryTime, vehicle.exitTime)}
                      </span>
                    </div>
                    <div className="search-result-field">
                      <span className="search-result-field-label">Type</span>
                      <span className="search-result-field-value">{vehicle.vehicleType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VehicleExit;
