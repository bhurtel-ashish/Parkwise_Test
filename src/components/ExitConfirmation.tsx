import { useState, useEffect, useRef } from 'react';
import { formatTime, formatDuration, getVehicleTypeEmoji, type Vehicle } from '../types';
import { CloseIcon, ExitIcon, AlertIcon } from './Icons';

interface ExitConfirmationProps {
  vehicle: Vehicle;
  onConfirm: () => Promise<boolean>;
  onCancel: () => void;
}

const ExitConfirmation = ({ vehicle, onConfirm, onCancel }: ExitConfirmationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    confirmButtonRef.current?.focus();

    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isLoading, onCancel]);

  useEffect(() => {
    const previousActiveElement = document.activeElement;
    return () => {
      (previousActiveElement as HTMLElement)?.focus();
    };
  }, []);

  const handleConfirm = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    const success = await onConfirm();
    
    if (success) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setError('Failed to process exit. Please try again.');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel();
    }
  };

  return (
    <div
      className="exit-confirmation-overlay"
      onClick={handleBackdropClick}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="exit-dialog-title"
      aria-describedby="exit-dialog-description"
    >
      <div
        className="exit-confirmation-modal"
        ref={modalRef}
        onClick={e => e.stopPropagation()}
      >
        <div className="exit-dialog-header">
          <div className="exit-dialog-icon">
            <AlertIcon width={24} height={24} />
          </div>
          <div className="exit-dialog-title-wrapper">
            <h2 id="exit-dialog-title" className="exit-dialog-title">
              Confirm Vehicle Exit
            </h2>
            <p id="exit-dialog-description" className="exit-dialog-subtitle">
              This will free the parking slot and update records
            </p>
          </div>
          <button
            className="exit-dialog-close"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <div className="exit-dialog-content">
          {/* Vehicle Information Card */}
          <div className="vehicle-info-card">
            <div className="vehicle-info-header">
              <div className="vehicle-info-icon">
                {getVehicleTypeEmoji(vehicle.vehicleType)}
              </div>
              <div className="vehicle-info-main">
                <div className="vehicle-info-number">{vehicle.vehicleNumber}</div>
                <div className="vehicle-info-owner">{vehicle.ownerName}</div>
              </div>
              <div className="vehicle-info-type">
                {vehicle.vehicleType}
              </div>
            </div>
          </div>

          {/* Parking Details Grid */}
          <div className="parking-details-grid">
            <div className="parking-detail-item">
              <span className="parking-detail-label">Parking Slot</span>
              <span className="parking-detail-value slot">{vehicle.slotNumber}</span>
            </div>
            <div className="parking-detail-item">
              <span className="parking-detail-label">Entry Time</span>
              <span className="parking-detail-value">{formatTime(vehicle.entryTime)}</span>
            </div>
            <div className="parking-detail-item duration">
              <span className="parking-detail-label">Parking Duration</span>
              <span className="parking-detail-value duration-value">
                {formatDuration(vehicle.entryTime, null)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="exit-dialog-error" role="alert">
              <AlertIcon width={16} height={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="exit-dialog-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
            type="button"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <ExitIcon width={18} height={18} />
                Confirm Exit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmation;
