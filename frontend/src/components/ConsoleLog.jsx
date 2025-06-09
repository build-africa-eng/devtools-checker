import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  MessageCircle,
} from 'lucide-react';

function ConsoleLog({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center">
        No console logs found.
      </p>
    );
  }

  const getLogIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelStyles = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-950 border-red-500';
      case 'warn':
        return 'bg-yellow-950 border-yellow-500';
      case 'info':
        return 'bg-blue-950 border-blue-500';
      default:
        return 'bg-gray-900 border-gray-600';
    }
  };

  return (
    <div className="space-y-3">
      {logs.map((log, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 p-3 rounded border-l-4 ${getLevelStyles(
            log.level
          )}`}
        >
          {getLogIcon(log.level)}
          <div className="flex-1 space-y-1">
            <p className="font-mono text-sm break-words whitespace-pre-wrap">
              {Array.isArray(log.message)
                ? log.message.map((m, i) => (
                    <span key={i}>
                      {typeof m === 'object'
                        ? JSON.stringify(m, null, 2)
                        : String(m)}{' '}
                    </span>
                  ))
                : typeof log.message === 'object'
                ? JSON.stringify(log.message, null, 2)
                : String(log.message)}
            </p>
            {(log.timestamp || log.location) && (
              <div className="text-xs text-gray-400 space-y-0.5">
                {log.timestamp && <p>{log.timestamp}</p>}
                {log.location && (
                  <p>
                    {log.location.url}:{log.location.lineNumber}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConsoleLog;