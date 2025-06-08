import React from 'react';

const AnalyzeButton = ({ onAnalyze, loading, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onAnalyze}
      disabled={loading || disabled}
      className="p-2 bg-blue-600 rounded disabled:opacity-50 hover:bg-blue-700 transition"
    >
      {loading ? 'Analyzing...' : 'Analyze'}
    </button>
  );
};

export default AnalyzeButton;