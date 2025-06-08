import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

function NetworkLog({ requests }) {
  if (!requests || requests.length === 0) {
    return <p className="text-gray-400">No network requests found</p>;
  }

  const getStatusIcon = (status) => {
    if (typeof status === 'number' && status >= 400) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (typeof status === 'number') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-400" />;
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
      {requests.map((req, index) => (
        <div
          key={index}
          className={`p-2 rounded flex items-start gap-2 border-l-4 ${getBackground(req.status)}`}
        >
          {getStatusIcon(req.status)}
          <div className="flex-1 overflow-hidden">
            <p className="font-mono text-sm break-words whitespace-pre-wrap">
              {req.method ?? 'GET'} {req.url ?? '(no url)'}
            </p>
            <p className="text-xs text-gray-400">
              Status: {req.status ?? 'N/A'} | Type: {req.type ?? 'unknown'} | Time:{' '}
              {req.time === -1 || req.time == null ? 'N/A' : `${req.time}ms`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NetworkLog;