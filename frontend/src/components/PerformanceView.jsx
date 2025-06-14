import React, { useEffect, useRef } from 'react';

const PerformanceView = ({ performance }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (performance?.load > 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, 200, 100);
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, (performance.load / 5000) * 200, 50); // Scale load time (max 5s)
      ctx.fillStyle = 'green';
      ctx.fillText(`Load: ${performance.load}ms`, 10, 80);
      ctx.fillText(`DOM: ${performance.domContentLoaded}ms`, 10, 90);
    }
  }, [performance]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Performance</h2>
      <p>DOM Content Loaded: {performance?.domContentLoaded > 0 ? `${performance.domContentLoaded}ms` : 'N/A'}</p>
      <p>Load Time: {performance?.load > 0 ? `${performance.load}ms` : 'N/A'}</p>
      <p>Resources: {performance?.Documents || 'N/A'}</p>
      <canvas ref={canvasRef} width="200" height="100" className="border mt-2" />
    </div>
  );
};

export default PerformanceView;