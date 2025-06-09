import React from 'react';
import { Play } from 'lucide-react';
import PropTypes from 'prop-types';

const AnalyzeButton = ({ onAnalyze, loading, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onAnalyze}
      disabled={loading || disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded min-w-[120px] min-h-[40px] font-medium transition-colors ${
        loading || disabled
          ? 'bg-primary text-white opacity-50 cursor-not-allowed'
          : 'bg-primary text-white hover:bg-primary/90'
      }`}
      aria-label={loading ? 'Analyzing in progress' : 'Analyze website'}
      aria-busy={loading}
    >
      <Play className="w-4 h-4 shrink-0" />
      <span>{loading ? 'Analyzing...' : 'Analyze'}</span>
    </button>
  );
};

AnalyzeButton.propTypes = {
  onAnalyze: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
};

export default React.memo(AnalyzeButton);