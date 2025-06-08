import React from 'react';
import { FileDown, FileJson } from 'lucide-react';

const ExportButtons = ({ data }) => {
  const exportJSON = (dataset, filename) => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    downloadFile(url, filename);
  };

  const exportCSV = (dataset, filename) => {
    if (!dataset || dataset.length === 0) return;
    const keys = Object.keys(dataset[0]);
    const csv = [
      keys.join(','),
      ...dataset.map((row) =>
        keys
          .map((k) => {
            const value = row[k] ?? '';
            return typeof value === 'object'
              ? JSON.stringify(value).replace(/,/g, ' ')
              : JSON.stringify(value);
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, filename);
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-4 mt-4">
      <button
        onClick={() => exportJSON(data.logs, 'console-logs.json')}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
        aria-label="Export console logs as JSON"
      >
        <FileJson className="w-4 h-4" />
        Logs JSON
      </button>
      <button
        onClick={() => exportCSV(data.logs, 'console-logs.csv')}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition"
        aria-label="Export console logs as CSV"
      >
        <FileDown className="w-4 h-4" />
        Logs CSV
      </button>
      <button
        onClick={() => exportJSON(data.requests, 'network-requests.json')}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
        aria-label="Export network requests as JSON"
      >
        <FileJson className="w-4 h-4" />
        Requests JSON
      </button>
      <button
        onClick={() => exportCSV(data.requests, 'network-requests.csv')}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition"
        aria-label="Export network requests as CSV"
      >
        <FileDown className="w-4 h-4" />
        Requests CSV
      </button>
    </div>
  );
};

export default ExportButtons;