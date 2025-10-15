import PropTypes from 'prop-types';

/**
 * Highlight Card Component
 * Displays a single service highlight with icon
 */
const HighlightCard = ({ icon: Icon, text }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange/30 group">
      <div className="flex items-start gap-4">
        <div className="bg-navy/5 group-hover:bg-orange/10 rounded-xl p-3 transition-colors">
          <Icon className="w-6 h-6 text-navy group-hover:text-orange transition-colors" />
        </div>
        <div className="flex-1">
          <p className="text-gray-700 font-medium leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
};

HighlightCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  text: PropTypes.string.isRequired,
};

export default HighlightCard;

