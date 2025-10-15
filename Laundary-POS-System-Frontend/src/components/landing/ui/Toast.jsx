import PropTypes from 'prop-types';
import { CheckCircle, X } from 'lucide-react';

/**
 * Toast Notification Component
 * Shows success/error messages
 */
const Toast = ({ message, onClose, type = 'success' }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md`}>
        <CheckCircle className="w-6 h-6 flex-shrink-0" />
        <p className="font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['success', 'error']),
};

export default Toast;

