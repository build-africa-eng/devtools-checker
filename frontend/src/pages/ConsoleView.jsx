import React from 'react';
import { AlertCircle, AlertTriangle, Info, Filter } from 'lucide-react';
import ConsoleLog from '../components/ConsoleLog';

function ConsoleView({ logs, filter, setFilter }) {
  console.log('ConsoleView logs:', logs);

  const getIcon = (value) => {
    switch (value) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Filter className="w-4 h-4 text-gray-300" />;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Console Logs</h2>
      <div className="mb-2 flex items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 p-1 rounded text-white text-sm"
          aria-label="Filter console logs"
        >
          <option value="all">All</option>
          <option value="error">Errors</option>
          <option value="warning">Warnings</option>
          <option value="info">Info</option>
        </select>
        {getIcon(filter)}
      </div>
      {logs.length === 0 && filter !== 'all' && (
        <p className="text-gray-400">No logs match the selected filter.</p>
      )}
      <ConsoleLog logs={logs} />
    </div>
  );
}

export default ConsoleView;