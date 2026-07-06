import { useState, useEffect } from 'react';
import { useParking } from '../context/ParkingContext';
import { formatTime, formatDuration, getVehicleTypeEmoji } from '../types';
import { CloseIcon, ExitIcon, EntryIcon, CarIcon } from './Icons';

const SlotMap = () => {
  const { slots, vehicles, requestExitConfirmation, navigateToEntry } = useParking();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSlot(null);
    };
    if (selectedSlot) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [selectedSlot]);

  const rows = ['A', 'B', 'C'];

  const getSlotsForRow = (row: string) =>
    slots
      .filter(s => s.slotNumber.startsWith(row))
      .sort((a, b) => a.slotNumber.localeCompare(b.slotNumber));

  const getVehicleForSlot = (slotNumber: string) =>
    vehicles.find(v => v.slotNumber === slotNumber && v.isParked);

  const handleSlotClick = (slotNumber: string) => {
    setSelectedSlot(prev => prev === slotNumber ? null : slotNumber);
  };

  const handleExit = (slotNumber: string) => {
    const vehicle = getVehicleForSlot(slotNumber);
    if (vehicle) {
      requestExitConfirmation(vehicle, 'slot', slotNumber);
    }
    setSelectedSlot(null);
  };

  const selectedSlotData = selectedSlot ? slots.find(s => s.slotNumber === selectedSlot) : null;
  const selectedVehicle = selectedSlot ? getVehicleForSlot(selectedSlot) : undefined;

  const totalSlots = slots.length;
  const occupiedCount = slots.filter(s => s.status === 'occupied').length;
  const availableCount = totalSlots - occupiedCount;
  const occupancyRate = Math.round((occupiedCount / totalSlots) * 100);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Slot Map</h1>
        <p>Visual overview of parking facility</p>
      </div>

      {/* Facility Overview Bar */}
      <div className="facility-overview">
        <div className="facility-stat">
          <div className="facility-stat-icon available">
            <EntryIcon width={18} height={18} />
          </div>
          <div className="facility-stat-info">
            <div className="facility-stat-value">{availableCount}</div>
            <div className="facility-stat-label">Available</div>
          </div>
        </div>
        <div className="facility-stat">
          <div className="facility-stat-icon occupied">
            <CarIcon width={18} height={18} />
          </div>
          <div className="facility-stat-info">
            <div className="facility-stat-value">{occupiedCount}</div>
            <div className="facility-stat-label">Occupied</div>
          </div>
        </div>
        <div className="facility-stat">
          <div className="facility-stat-icon total">
            <span className="facility-stat-total">{totalSlots}</span>
          </div>
          <div className="facility-stat-info">
            <div className="facility-stat-value">{occupancyRate}%</div>
            <div className="facility-stat-label">Occupancy</div>
          </div>
        </div>
        <div className="facility-legend">
          <div className="legend-item">
            <span className="legend-dot available"></span>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot occupied"></span>
            <span>Occupied</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot selected"></span>
            <span>Selected</span>
          </div>
        </div>
      </div>

      {/* Main Parking Facility */}
      <div className="parking-facility">
        {/* Entrance Gate */}
        <div className="facility-entrance">
          <div className="entrance-marker">
            <span className="entrance-arrow">↓</span>
            <span>Entrance</span>
          </div>
        </div>

        {/* Main Driving Lane */}
        <div className="main-driving-lane">
          <div className="lane-direction">
            <span className="direction-arrow">↑</span>
          </div>
        </div>

        {/* Parking Sections */}
        <div className="parking-sections">
          {rows.map((row, rowIndex) => {
            const rowSlots = getSlotsForRow(row);
            const available = rowSlots.filter(s => s.status === 'available').length;
            const isLastRow = rowIndex === rows.length - 1;

            return (
              <div key={row} className="parking-row-section">
                {/* Row Label */}
                <div className="row-label">
                  <span className="row-letter">{row}</span>
                  <span className="row-availability">{available}/{rowSlots.length}</span>
                </div>

                {/* Parking Slots */}
                <div className="parking-slots-row">
                  {rowSlots.map(slot => {
                    const isOccupied = slot.status === 'occupied';
                    const vehicle = isOccupied ? getVehicleForSlot(slot.slotNumber) : undefined;
                    const isSelected = selectedSlot === slot.slotNumber;
                    const isHovered = hoveredSlot === slot.slotNumber;

                    return (
                      <div
                        key={slot.slotNumber}
                        className={`parking-slot ${slot.status} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                        onClick={() => handleSlotClick(slot.slotNumber)}
                        onMouseEnter={() => setHoveredSlot(slot.slotNumber)}
                        onMouseLeave={() => setHoveredSlot(null)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Slot ${slot.slotNumber} - ${slot.status}${vehicle ? ` - ${vehicle.vehicleNumber}` : ''}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSlotClick(slot.slotNumber);
                          }
                        }}
                      >
                        {/* Slot Number Badge */}
                        <div className="slot-number-badge">
                          {slot.slotNumber}
                        </div>

                        {/* Vehicle Indicator */}
                        {isOccupied && vehicle && (
                          <div className="vehicle-indicator">
                            <div className="vehicle-icon">
                              {getVehicleTypeEmoji(vehicle.vehicleType)}
                            </div>
                            <div className="vehicle-number">{vehicle.vehicleNumber}</div>
                          </div>
                        )}

                        {/* Status Indicator */}
                        <div className="slot-status-indicator">
                          {isOccupied ? (
                            <span className="occupied-dot"></span>
                          ) : (
                            <span className="available-check">✓</span>
                          )}
                        </div>

                        {/* Selection Ring */}
                        {isSelected && (
                          <div className="selection-ring"></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Aisle Divider (except last row) */}
                {!isLastRow && (
                  <div className="aisle-divider">
                    <div className="aisle-markings">
                      <span className="marking-dash"></span>
                      <span className="marking-dash"></span>
                      <span className="marking-dash"></span>
                      <span className="marking-dash"></span>
                      <span className="marking-dash"></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Exit Gate */}
        <div className="facility-exit">
          <div className="exit-marker">
            <span>Exit</span>
            <span className="exit-arrow">↑</span>
          </div>
        </div>
      </div>

      {/* Slot Detail Panel */}
      {selectedSlot && (
        <div
          className="slot-detail-overlay"
          onClick={() => setSelectedSlot(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Slot ${selectedSlot} details`}
        >
          <div className="slot-detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div className="detail-title">
                <span className="detail-slot-number">{selectedSlot}</span>
                <span className={`detail-status ${selectedSlotData?.status}`}>
                  {selectedSlotData?.status}
                </span>
              </div>
              <button
                className="detail-close"
                onClick={() => setSelectedSlot(null)}
                aria-label="Close"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            {selectedSlotData?.status === 'occupied' && selectedVehicle ? (
              <>
                <div className="detail-content">
                  <div className="detail-vehicle-preview">
                    <div className="vehicle-preview-icon">
                      {getVehicleTypeEmoji(selectedVehicle.vehicleType)}
                    </div>
                    <div className="vehicle-preview-info">
                      <div className="vehicle-preview-number">{selectedVehicle.vehicleNumber}</div>
                      <div className="vehicle-preview-owner">{selectedVehicle.ownerName}</div>
                    </div>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Vehicle Type</span>
                      <span className="detail-value">{selectedVehicle.vehicleType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Entry Time</span>
                      <span className="detail-value">{formatTime(selectedVehicle.entryTime)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Duration</span>
                      <span className="detail-value">{formatDuration(selectedVehicle.entryTime, null)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Row</span>
                      <span className="detail-value">{selectedSlot.charAt(0)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-actions">
                  <button
                    className="btn btn-danger btn-block"
                    onClick={() => handleExit(selectedSlot)}
                  >
                    <ExitIcon width={18} height={18} />
                    Process Exit
                  </button>
                </div>
              </>
            ) : (
              <div className="detail-content">
                <div className="available-slot-message">
                  <div className="available-icon">✓</div>
                  <div className="available-text">
                    <div className="available-title">Slot Available</div>
                    <div className="available-subtitle">Ready for vehicle entry</div>
                  </div>
                </div>
                <div className="detail-actions">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => {
                      navigateToEntry(selectedSlot);
                      setSelectedSlot(null);
                    }}
                  >
                    <EntryIcon width={18} height={18} />
                    Park Vehicle Here
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotMap;
