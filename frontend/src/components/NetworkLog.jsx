import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

function NetworkLog({ requests }) {
  if (!requests || requests.length === 0) {
    return <p className="text-gray-400">No network requests found</p>;
  }

  const getStatusIcon = (status) => {
    if (status && status >= 400) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (status && status < 400) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-2">
      {requests.map((req, index) => (
        <div
          key={index}
          className={`p-2 rounded flex items-start gap-2 ${
            req.status && req.status >= 400 ? 'bg-red-900' : 'bg-gray-800'
          }`}
        >
          {getStatusIcon(req.status)}
          <div className="flex-1">
            <p className="font-mono text-sm">{req.method} {req.url}</p>
            <p className="text-xs text-gray-400">
              Status: {req.status ?? 'N/A'} | Type: {req.type} | Time: {req.time === -1 ? 'N/A' : `${req.time}ms`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NetworkLog;