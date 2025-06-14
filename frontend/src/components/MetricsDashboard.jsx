import React from 'react';
import { useAnalysis } from '../hooks/useAnalysis';

export function MetricsDashboard({ url }) {
  const { analyze, result, loading, error } = useAnalysis();

  React.useEffect(() => {
    if (url) analyze(url);
  }, [url, analyze]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-error text-center">{error}</div>;

  return (
    result && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <div className="metric-card">
          <div className="metric-value">{result.performance.load.toFixed(2)}s</div>
          <div className="metric-label">Load Time</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{result.performance.domContentLoaded.toFixed(2)}ms</div>
          <div className="metric-label">DOM Content Loaded</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{result.performance.firstPaint.toFixed(2)}ms</div>
          <div className="metric-label">First Paint</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{result.performance.largestContentfulPaint.toFixed(2)}ms</div>
          <div className="metric-label">Largest Contentful Paint</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{result.domMetrics.nodeCount || 0}</div>
          <div className="metric-label">DOM Nodes</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{result.domMetrics.maxDepth || 0}</div>
          <div className="metric-label">DOM Depth</div>
        </div>
        {result.warning && (
          <div className="metric-card bg-warning/10 text-warning">
            <div className="metric-value">Warning</div>
            <div className="metric-label">{result.warning}</div>
          </div>
        )}
      </div>
    )
  );
}