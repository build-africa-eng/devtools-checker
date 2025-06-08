import React from 'react';
import { Play } from 'lucide-react';
import PropTypes from 'prop-types';

const AnalyzeButton = ({ onAnalyze, loading, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onAnalyze}
      disabled={loading || disabled}
      className="flex items-center gap-2 p-2 bg-blue-600 rounded disabled:opacity-50 hover:bg-blue-700 transition text-white"
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