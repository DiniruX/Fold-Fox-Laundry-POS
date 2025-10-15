import PropTypes from 'prop-types';

/**
 * Reusable Input Component
 * Handles text, email, tel inputs with validation styling
 */
const Input = ({ 
  label, 
  icon: Icon, 
  error, 
  type = 'text',
  ...props 
}) => {
  return (
    <div>
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          {Icon && <Icon className="w-4 h-4 text-navy" />}
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full px-4 py-3 rounded-xl border ${
          error ? 'border-red-500' : 'border-gray-300'
        } focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange transition-all`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  icon: PropTypes.elementType,
  error: PropTypes.string,
  type: PropTypes.string,
};

export default Input;

