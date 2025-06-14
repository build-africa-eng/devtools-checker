import React from 'react';
import PropTypes from 'prop-types';

const LogPanel = ({ logs }) => {
  return (
    <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 rounded-lg shadow-lg h-64 overflow-y-auto">
      <h2 className="text-lg font-bold mb-2">Runtime Logs</h2>
      {logs.length === 0 ? (
        <p className="text-gray-400">No logs yet. Analyze a URL to see runtime data.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log, index) => (
            <li key={index} className="text-sm break-all">
              <span className="font-mono text-gray-300">[{(new Date(log.timestamp)).toLocaleTimeString()}]</span>{' '}
              {log.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

LogPanel.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
  })).isRequired,
};

export default LogPanel;