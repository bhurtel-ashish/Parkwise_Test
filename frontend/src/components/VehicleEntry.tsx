import { useState, useEffect, type FormEvent } from 'react';
import { useParking } from '../context/ParkingContext';
import type { VehicleType } from '../types';
import { EntryIcon } from './Icons';

const VEHICLE_ENTRY_AUTO_ASSIGN = '__auto__';

const VehicleEntry = () => {
  const { slots, addVehicle, preselectedSlot, setPreselectedSlot } = useParking();
  const availableSlots = slots.filter(s => s.status === 'available');

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Car');
  const [slotNumber, setSlotNumber] = useState(VEHICLE_ENTRY_AUTO_ASSIGN);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedSlot) {
      const slotStillAvailable = availableSlots.find(s => s.slotNumber === preselectedSlot);
      if (slotStillAvailable) {
        setSlotNumber(preselectedSlot);
      }
      setPreselectedSlot(null);
    }
  }, [preselectedSlot, availableSlots, setPreselectedSlot]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!vehicleNumber.trim()) newErrors.vehicleNumber = 'Vehicle number is required';
    if (!ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (slotNumber !== VEHICLE_ENTRY_AUTO_ASSIGN && !slotNumber) {
      newErrors.slotNumber = 'Please select a parking slot';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    let finalSlotNumber = slotNumber;
    if (slotNumber === VEHICLE_ENTRY_AUTO_ASSIGN) {
      const firstAvailable = availableSlots[0];
      if (firstAvailable) {
        finalSlotNumber = firstAvailable.slotNumber;
      } else {
        setErrors({ slotNumber: 'No parking slots available' });
        setIsSubmitting(false);
        return;
      }
    }

    const result = addVehicle({
      vehicleNumber: vehicleNumber.trim(),
      ownerName: ownerName.trim(),
      vehicleType,
      slotNumber: finalSlotNumber,
    });

    if (result.success) {
      setVehicleNumber('');
      setOwnerName('');
      setVehicleType('Car');
      setSlotNumber(VEHICLE_ENTRY_AUTO_ASSIGN);
      setErrors({});
    }
    setIsSubmitting(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Vehicle Entry</h1>
        <p>Register a new vehicle entering the parking facility</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="vehicle-number">
              Vehicle Number <span className="required">*</span>
            </label>
            <input
              id="vehicle-number"
              type="text"
              className={`form-input ${errors.vehicleNumber ? 'error' : ''}`}
              value={vehicleNumber}
              onChange={(e) => {
                setVehicleNumber(e.target.value);
                if (errors.vehicleNumber) setErrors(prev => ({ ...prev, vehicleNumber: '' }));
              }}
              placeholder="e.g., ABC-1234"
              autoComplete="off"
            />
            {errors.vehicleNumber && <div className="form-error">{errors.vehicleNumber}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="owner-name">
              Owner Name <span className="required">*</span>
            </label>
            <input
              id="owner-name"
              type="text"
              className={`form-input ${errors.ownerName ? 'error' : ''}`}
              value={ownerName}
              onChange={(e) => {
                setOwnerName(e.target.value);
                if (errors.ownerName) setErrors(prev => ({ ...prev, ownerName: '' }));
              }}
              placeholder="e.g., John Doe"
              autoComplete="off"
            />
            {errors.ownerName && <div className="form-error">{errors.ownerName}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="vehicle-type">
                Vehicle Type <span className="required">*</span>
              </label>
              <select
                id="vehicle-type"
                className="form-select"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              >
                <option value="Car">🚗 Car</option>
                <option value="Bike">🏍️ Bike</option>
                <option value="EV">⚡ EV</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="slot-select">
                Preferred Slot <span className="required">*</span>
              </label>
              <select
                id="slot-select"
                className={`form-select ${errors.slotNumber ? 'error' : ''}`}
                value={slotNumber}
                onChange={(e) => {
                  setSlotNumber(e.target.value);
                  if (errors.slotNumber) setErrors(prev => ({ ...prev, slotNumber: '' }));
                }}
              >
                <option value={VEHICLE_ENTRY_AUTO_ASSIGN}>Auto Assign</option>
                {availableSlots.map(slot => (
                  <option key={slot.slotNumber} value={slot.slotNumber}>
                    Slot {slot.slotNumber}
                  </option>
                ))}
              </select>
              {errors.slotNumber && <div className="form-error">{errors.slotNumber}</div>}
              {availableSlots.length === 0 && (
                <div className="form-error">No slots available</div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting || availableSlots.length === 0}>
            <EntryIcon width={18} height={18} />
            Register Entry
          </button>
        </form>
      </div>
    </div>
  );
};

export default VehicleEntry;
