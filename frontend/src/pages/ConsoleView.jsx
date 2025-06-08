import React from 'react';
import { AlertCircle, AlertTriangle, Info, Filter } from 'lucide-react';
import ConsoleLog from '../components/ConsoleLog';

function ConsoleView({ logs, filter, setFilter }) {
  console.log('ConsoleView logs:', logs);

  const getIcon = (value) => {
    switch (value) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-error" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-accent" />;
      case 'info':
        return <Info className="w-4 h-4 text-primary" />;
      default:
        return <Filter className="w-4 h-4 text-text/70" />;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">Console Logs</h2>
      <div className="mb-2 flex items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-background-dark p-1 rounded text-text text-sm border border-gray-700 focus:border-primary"
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
        <p className="text-text/70">No logs match the selected filter.</p>
      )}
      <ConsoleLog logs={logs} />
    </div>
  );
}

export default ConsoleView;