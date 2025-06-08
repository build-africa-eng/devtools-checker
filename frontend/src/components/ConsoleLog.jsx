import React from 'react';
import { AlertCircle, AlertTriangle, Info, MessageCircle } from 'lucide-react';

function ConsoleLog({ logs }) {
  console.log('ConsoleLog logs:', logs);
  if (!logs || logs.length === 0) {
    return <p className="text-gray-400">No console logs found</p>;
  }

  const getLogIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-2">
      {logs.map((log, index) => (
        <div
          key={index}
          className={`p-2 rounded flex items-start gap-2 ${
            log.level === 'error' ? 'bg-red-900' :
            log.level === 'warn' ? 'bg-yellow-900' :
            log.level === 'info' ? 'bg-blue-900' : 'bg-gray-800'
          }`}
        >
          {getLogIcon(log.level)}
          <div className="flex-1">
            <p className="font-mono text-sm">{log.message}</p>
            {log.timestamp && (
              <p className="text-xs text-gray-400">{log.timestamp}</p>
            )}
            {log.location && (
              <p className="text-xs text-gray-400">
                {log.location.url}:{log.location.lineNumber}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConsoleLog;