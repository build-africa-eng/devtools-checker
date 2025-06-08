import React from 'react';
import { Play } from 'lucide-react';
import PropTypes from 'prop-types';

const AnalyzeButton = ({ onAnalyze, loading, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onAnalyze}
      disabled={loading || disabled}
      className="flex items-center gap-2 p-2 bg-primary rounded disabled:opacity-50 hover:bg-primary/90 transition-colors text-white min-w-button min-h-button"
      aria-label={loading ? 'Analyzing in progress' : 'Analyze website'}
      aria-busy={loading}
    >
      <Play className="w-4 h-4" />
      {loading ? 'Analyzing...' : 'Analyze'}
    </button>
  );
};

AnalyzeButton.propTypes = {
  onAnalyze: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
};

export default AnalyzeButton;