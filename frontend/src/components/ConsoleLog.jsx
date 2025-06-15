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

  // Uses 'type' from backend (e.g., 'error', 'warn', 'info', 'log')
  const getLogIcon = (type) => {
    const commonProps = { className: 'w-4 h-4 shrink-0', 'aria-hidden': true };
    switch (type) {
      case 'error':
        return <AlertCircle {...commonProps} className="text-red-500" />;
      case 'warn':
        return <AlertTriangle {...commonProps} className="text-yellow-500" />;
      case 'info':
        return <Info {...commonProps} className="text-blue-500" />;
      case 'log': // For console.log
      case 'debug': // For console.debug
      default: // Fallback for any other type
        return <MessageCircle {...commonProps} className="text-gray-500" />;
    }
  };

  // Uses 'type' from backend
  const getLevelStyles = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-950 border-red-500';
      case 'warn':
        return 'bg-yellow-950 border-yellow-500';
      case 'info':
        return 'bg-blue-950 border-blue-500';
      case 'log':
      case 'debug':
      default:
        return 'bg-gray-900 border-gray-600';
    }
  };

  return (
    <div className="space-y-3">
      {logs.map((log, index) => (
        <div
          key={index}
          // Use log.type here for consistency
          className={`flex items-start gap-3 p-3 rounded border-l-4 ${getLevelStyles(log.type)}`}
          role="group"
          aria-label={`Console log ${index + 1} - ${log.type}`}
        >
          {getLogIcon(log.type)}
          <div className="flex-1 space-y-1">
            <pre className="font-mono text-sm whitespace-pre-wrap break-words">
              {/* Iterate through each argument (log.args) */}
              {Array.isArray(log.args) && log.args.length > 0 ? (
                log.args.map((arg, argIdx) => (
                  <React.Fragment key={argIdx}>
                    {typeof arg === 'object' && arg !== null
                      ? (arg.error // <-- CHECK FOR 'error' PROPERTY
                          ? // Format the structured error object nicely
                            `Error: ${arg.error}${arg.stack ? `\nStack: ${arg.stack}` : ''}`
                          : // For other generic objects, stringify them
                            JSON.stringify(arg, null, 2))
                      : // For primitive values (strings, numbers, booleans)
                        String(arg)}{' '}
                  </React.Fragment>
                ))
              ) : (
                // Fallback to log.text if log.args is empty or not an array
                String(log.text || 'No message content')
              )}
            </pre>

            {(log.timestamp || log.url) && ( // <-- Check log.url directly
              <div className="text-xs text-gray-400 space-y-0.5">
                {log.timestamp && <p>{new Date(log.timestamp).toLocaleTimeString()}</p>}
                {log.url && ( // <-- Access log.url directly
                  <p>
                    {/* Display only the file name from the URL if it's long */}
                    {log.url.split('/').pop() || log.url}
                    {log.lineNumber !== -1 ? `:${log.lineNumber}` : ''}
                    {log.columnNumber !== -1 && log.columnNumber !== -0 ? `:${log.columnNumber}` : ''}
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