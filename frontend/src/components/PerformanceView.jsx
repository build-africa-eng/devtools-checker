import React from 'react';

const PerformanceView = ({ performance }) => (
  <div className="p-4">
    <h2 className="text-lg font-bold">Performance</h2>
    <p>DOM Content Loaded: {performance?.domContentLoaded > 0 ? `${performance.domContentLoaded}ms` : 'N/A'}</p>
    <p>Load Time: {performance?.load > 0 ? `${performance.load}ms` : 'N/A'}</p>
  </div>
);

export default PerformanceView;