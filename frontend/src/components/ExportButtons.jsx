import React from 'react';
import { FileDown, FileJson } from 'lucide-react';

const ExportButtons = ({ data }) => {
  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  const exportJSON = (dataset, filename) => {
    if (!dataset || dataset.length === 0) return;
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
            const value = row[k];
            if (typeof value === 'object') {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            return `"${(value ?? '').toString().replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, filename);
  };

  return (
    <div className="flex flex-wrap gap-4 mt-4">
      <button
        onClick={() => exportJSON(data.logs, 'console-logs.json')}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-white font-medium rounded-lg transition hover:bg-secondary/80 min-w-button min-h-button"
        aria-label="Export all console logs as JSON"
      >
        <FileJson className="w-4 h-4" />
        Export Logs JSON
      </button>
      <button
        onClick={() => exportCSV(data.logs, 'console-logs.csv')}
        className="flex items-center gap-2 px-4 py-2 bg-accent text-black font-medium rounded-lg transition hover:bg-accent/70 min-w-button min-h-button"
        aria-label="Export all console logs as CSV"
      >
        <FileDown className="w-4 h-4 text-gray-800" />
        Export Logs CSV
      </button>
      <button
        onClick={() => exportJSON(data.requests, 'network-requests.json')}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-white font-medium rounded-lg transition hover:bg-secondary/80 min-w-button min-h-button"
        aria-label="Export all network requests as JSON"
      >
        <FileJson className="w-4 h-4" />
        Requests JSON
      </button>
      <button
        onClick={() => exportCSV(data.requests, 'network-requests.csv')}
        className="flex items-center gap-2 px-4 py-2 bg-accent text-black font-medium rounded-lg transition hover:bg-accent/70 min-w-button min-h-button"
        aria-label="Export all network requests as CSV"
      >
        <FileDown className="w-4 h-4 text-gray-800" />
        Requests CSV
      </button>
    </div>
  );
};

export default ExportButtons;