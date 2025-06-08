import { useState } from 'react';
import ConsoleLog from '../components/ConsoleLog';

function ConsoleView({ logs, filters }) {
  const [filter, setFilter] = useState('all');
  const filteredLogs = logs.filter(log => {
    if (filter === 'all' && !Object.values(filters).some(Boolean)) return true;
    if (filters.errors && log.level === 'error') return true;
    if (filters.warnings && log.level === 'warn') return true;
    return false;
  });

  return (
    <>
      <div className="mb-2">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-gray-800 p-1 rounded text-white">
          <option value="all">All</option>
          <option value="error">Errors</option>
          <option value="warning">Warnings</option>
          <option value="info">Info</option>
        </select>
      </div>
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <p className="text-gray-500 text-center">No logs available</p>
        ) : (
          filteredLogs.map((log, index) => <ConsoleLog key={index} log={log} />)
        )}
      </div>
    </>
  );
}

export default ConsoleView;