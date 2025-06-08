import React from 'react';
import { FileDown, FileJson } from 'lucide-react';

const ExportButtons = ({ data }) => {
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    downloadFile(url, 'devtools-export.json');
  };

  const exportCSV = () => {
    const keys = Object.keys(data[0] || {});
    const csv = [
      keys.join(','),
      ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, 'devtools-export.csv');
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-4 mt-4">
      <button
        onClick={exportJSON}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
      >
        <FileJson className="w-4 h-4" />
        Export JSON
      </button>
      <button
        onClick={exportCSV}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition"
      >
        <FileDown className="w-4 h-4" />
        Export CSV
      </button>
    </div>
  );
};

export default ExportButtons;