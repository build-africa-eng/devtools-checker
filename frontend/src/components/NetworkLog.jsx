import React from 'react';
import { Globe, UploadCloud } from 'lucide-react';

const getStatusStyle = (status) => {
  if (status >= 500) return 'text-red-400';
  if (status >= 400) return 'text-yellow-400';
  if (status >= 300) return 'text-blue-400';
  return 'text-green-400';
};

const getCardStyle = (status) => {
  if (status >= 500) return 'bg-red-950 border-red-700';
  if (status >= 400) return 'bg-yellow-900 border-yellow-600';
  if (status >= 300) return 'bg-blue-900 border-blue-600';
  return 'bg-green-900 border-green-600';
};

const NetworkLog = ({ requests = [] }) => {
  return (
    <div className="space-y-2">
      {requests.length === 0 ? (
        <p className="text-sm text-gray-500 text-center italic">No network requests found.</p>
      ) : (
        requests.map((req, index) => (
          <div
            key={index}
            className={`border rounded-lg p-3 flex flex-col sm:flex-row sm:items-start gap-2 ${getCardStyle(req.status)}`}
          >
            <div className="flex items-center gap-2 min-w-[5rem]">
              {req.method === 'POST' || req.method === 'PUT' ? (
                <UploadCloud className="w-5 h-5 text-pink-400" />
              ) : (
                <Globe className="w-5 h-5 text-blue-400" />
              )}
              <span className="uppercase text-sm font-semibold">{req.method}</span>
            </div>

            <div className="flex-1">
              <div className="text-sm break-all">
                <span className="font-medium text-gray-200">{req.url}</span>
              </div>
              <div className="text-xs mt-1 flex flex-wrap gap-4 text-gray-400">
                <span>
                  Status:{' '}
                  <span className={`font-semibold ${getStatusStyle(req.status)}`}>
                    {req.status}
                  </span>
                </span>
                <span>Time: {req.time} ms</span>
                {req.type && <span>Type: {req.type}</span>}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default NetworkLog;
