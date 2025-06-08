import React from 'react';
import { Play } from 'lucide-react';
import PropTypes from 'prop-types';

const AnalyzeButton = ({ onAnalyze, loading, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onAnalyze}
      disabled={loading || disabled}
      className={`flex items-center gap-2 p-2 bg-primary text-white rounded min-w-button min-h-button transition-colors ${
        loading || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
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

export default AnalyzeButton;