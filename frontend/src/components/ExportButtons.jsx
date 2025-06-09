import React from 'react';
import { FileDown, FileJson } from 'lucide-react';

const ExportButtons = ({ data }) => {
  const createDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  const exportJSON = (dataset, filename) => {
    if (!Array.isArray(dataset) || dataset.length === 0) return;
    const jsonBlob = new Blob([JSON.stringify(dataset, null, 2)], {
      type: 'application/json',
    });
    createDownload(jsonBlob, filename);
  };

  const exportCSV = (dataset, filename) => {
    if (!Array.isArray(dataset) || dataset.length === 0) return;

    const keys = Object.keys(dataset[0]);
    const rows = dataset.map((row) =>
      keys
        .map((key) => {
          const val = row[key];
          if (val === null || val === undefined) return '""';
          if (typeof val === 'object') {
            return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          }
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = `\uFEFF${keys.join(',')}\n${rows.join('\n')}`;
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    createDownload(csvBlob, filename);
  };

  return (
    <div className="flex flex-wrap gap-4 mt-4">
      <button
        onClick={() => exportJSON(data?.logs, 'console-logs.json')}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-white font-medium rounded-lg transition hover:bg-secondary/80 focus:outline-none min-w-button min-h-button"
        aria-label="Export all console logs as JSON"
      >
        <FileJson className="w-4 h-4" />
        Logs JSON
      </button>
      <button
        onClick={() => exportCSV(data?.logs, 'console-logs.csv')}
        className="flex items-center gap-2 px-4 py-2 bg-accent text-black font-medium rounded-lg transition hover:bg-accent/70 focus:outline-none min-w-button min-h-button"
        aria-label="Export all console logs as CSV"
      >
        <FileDown className="w-4 h-4 text-gray-800" />
        Logs CSV
      </button>
      <button
        onClick={() => exportJSON(data?.requests, 'network-requests.json')}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-white font-medium rounded-lg transition hover:bg-secondary/80 focus:outline-none min-w-button min-h-button"
        aria-label="Export all network requests as JSON"
      >
        <FileJson className="w-4 h-4" />
        Requests JSON
      </button>
      <button
        onClick={() => exportCSV(data?.requests, 'network-requests.csv')}
        className="flex items-center gap-2 px-4 py-2 bg-accent text-black font-medium rounded-lg transition hover:bg-accent/70 focus:outline-none min-w-button min-h-button"
        aria-label="Export all network requests as CSV"
      >
        <FileDown className="w-4 h-4 text-gray-800" />
        Requests CSV
      </button>
    </div>
  );
};

export default ExportButtons;