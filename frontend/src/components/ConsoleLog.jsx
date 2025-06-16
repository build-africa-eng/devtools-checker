import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  MessageCircle,
} from 'lucide-react';
import CopyButton from './CopyButton';

function ConsoleLog({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center">
        No console logs found.
      </p>
    );
  }

  const getLogIcon = (type) => {
    const props = { className: 'w-4 h-4 shrink-0', 'aria-hidden': true };
    switch (type) {
      case 'error': return <AlertCircle {...props} className="text-red-500" />;
      case 'warn': return <AlertTriangle {...props} className="text-yellow-500" />;
      case 'info': return <Info {...props} className="text-blue-500" />;
      default: return <MessageCircle {...props} className="text-gray-500" />;
    }
  };

  const getLevelStyles = (type) => {
    switch (type) {
      case 'error': return 'bg-red-950 border-red-500';
      case 'warn': return 'bg-yellow-950 border-yellow-500';
      case 'info': return 'bg-blue-950 border-blue-500';
      default: return 'bg-gray-900 border-gray-600';
    }
  };

  return (
    <div className="space-y-3">
      {logs.map((log, index) => {
        const content =
          Array.isArray(log.args) && log.args.length > 0
            ? log.args
                .map((arg) =>
                  typeof arg === 'object' && arg !== null
                    ? arg.error
                      ? `Error: ${arg.error}${arg.stack ? `\nStack: ${arg.stack}` : ''}`
                      : JSON.stringify(arg, null, 2)
                    : String(arg)
                )
                .join(' ')
            : String(log.text || 'No message content');

        return (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded border-l-4 ${getLevelStyles(log.type)}`}
            role="group"
            aria-label={`Console log ${index + 1} - ${log.type}`}
          >
            {getLogIcon(log.type)}
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-start">
                <pre className="font-mono text-sm whitespace-pre-wrap break-words">{content}</pre>
                <CopyButton text={content} className="ml-2" />
              </div>

              {(log.timestamp || log.url) && (
                <div className="text-xs text-gray-400 space-y-0.5">
                  {log.timestamp && <p>{new Date(log.timestamp).toLocaleTimeString()}</p>}
                  {log.url && (
                    <p>
                      {log.url.split('/').pop() || log.url}
                      {log.lineNumber >= 0 ? `:${log.lineNumber}` : ''}
                      {log.columnNumber > 0 ? `:${log.columnNumber}` : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ConsoleLog;