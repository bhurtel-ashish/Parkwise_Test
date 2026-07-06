import { useParking } from '../context/ParkingContext';
import { CheckIcon, CloseIcon, AlertIcon, InfoIcon } from './Icons';

const ToastIcon = ({ type }: { type: 'success' | 'error' | 'info' }) => {
  switch (type) {
    case 'success': return <CheckIcon width={14} height={14} />;
    case 'error': return <AlertIcon width={14} height={14} />;
    case 'info': return <InfoIcon width={14} height={14} />;
  }
};

const ToastContainer = () => {
  const { toasts, removeToast } = useParking();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="alert" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-icon">
            <ToastIcon type={toast.type} />
          </div>
          <div className="toast-message">{toast.message}</div>
          <button
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Close notification"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
