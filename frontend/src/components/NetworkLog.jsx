import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import CopyButton from './CopyButton';

function NetworkLog({ requests }) {
  if (!requests || requests.length === 0) {
    return (
      <p className="text-gray-400 italic text-center">No network requests found.</p>
    );
  }

  const getStatusIcon = (status) => {
    const props = { className: 'h-4 w-4 shrink-0', 'aria-hidden': true };
    if (typeof status === 'number' && status >= 400) return <XCircle {...props} className="text-red-500" />;
    if (typeof status === 'number') return <CheckCircle {...props} className="text-green-500" />;
    return <Clock {...props} className="text-gray-400" />;
  };

  const getBackground = (status) => {
    if (typeof status !== 'number') return 'bg-gray-900 border-gray-600';
    if (status >= 500) return 'bg-red-950 border-red-500';
    if (status >= 400) return 'bg-red-900 border-red-500';
    if (status >= 300) return 'bg-yellow-900 border-yellow-500';
    return 'bg-green-900 border-green-500';
  };

  return (
    <div className="space-y-2">
      {requests.map((req, index) => {
        const status = req.status;
        const method = req.method ?? 'GET';
        const url = req.url ?? '(no url)';
        const time = req.time === -1 || req.time == null ? 'N/A' : `${req.time}ms`;
        const type = req.type ?? 'unknown';

        return (
          <div
            key={index}
            className={`p-3 rounded flex items-start gap-3 border-l-4 ${getBackground(status)}`}
            role="region"
            aria-label={`Network request: ${method} ${url}`}
          >
            {getStatusIcon(status)}
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-start">
                <p className="font-mono text-sm break-words whitespace-pre-wrap">
                  {method} {url}
                </p>
                <CopyButton text={`${method} ${url}`} />
              </div>
              <p className="text-xs text-gray-300 mt-1 space-x-2">
                <span>Status: {status ?? 'N/A'}</span>
                <span>Type: {type}</span>
                <span>Time: {time}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NetworkLog;