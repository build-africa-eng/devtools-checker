import React from 'react';
import { AlertCircle, Info, Terminal, TriangleAlert } from 'lucide-react';

const ConsoleLog = ({ logs = [] }) => {
  const getIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="text-red-500 w-5 h-5" />;
      case 'warn':
        return <TriangleAlert className="text-yellow-400 w-5 h-5" />;
      case 'info':
        return <Info className="text-blue-400 w-5 h-5" />;
      default:
        return <Terminal className="text-gray-300 w-5 h-5" />;
    }
  };

  const getStyle = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-950 border-red-700 text-red-300';
      case 'warn':
        return 'bg-yellow-900 border-yellow-600 text-yellow-200';
      case 'info':
        return 'bg-blue-900 border-blue-600 text-blue-200';
      default:
        return 'bg-gray-800 border-gray-700 text-gray-300';
    }
  };

  return (
    <div className="space-y-2">
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center italic">No console logs found.</p>
      ) : (
        logs.map((log, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 p-3 border rounded-lg ${getStyle(log.level)}`}
          >
            <div className="pt-1">{getIcon(log.level)}</div>
            <div className="text-sm whitespace-pre-wrap break-words flex-1">
              <strong className="block font-medium mb-1">{log.level.toUpperCase()}</strong>
              {log.message}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ConsoleLog;