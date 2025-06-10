import { useEffect, useRef, useState } from 'react';

export function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [controller, setController] = useState(null);
  const retryLimit = 2;
  const pollRef = useRef(null); // For polling

  const friendlyError = (msg = '') => {
    const lowered = msg.toLowerCase();
    if (lowered.includes('failed to fetch')) {
      return 'Cannot connect to the analysis server. Please check your network or try again later.';
    }
    if (lowered.includes('timeout')) {
      return 'The website took too long to respond and the analysis timed out.';
    }
    if (lowered.includes('networkerror') || lowered.includes('dns')) {
      return 'Network issue: Please check your internet connection or try a different URL.';
    }
    return msg || 'An unknown error occurred.';
  };

  const validateApiUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const cancel = () => controller?.abort?.();

  const analyze = async (url, options = {}) => {
    const trimmedUrl = url?.trim();
    if (!trimmedUrl || !/^https?:\/\//i.test(trimmedUrl)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return null;
    }

    let attempt = 0;

    while (attempt <= retryLimit) {
      const ctrl = new AbortController();
      setController(ctrl);
      const timeoutId = setTimeout(() => ctrl.abort(), 30000);

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const baseApi = import.meta.env.VITE_API_URL;
        if (!baseApi || !validateApiUrl(baseApi)) {
          throw new Error('API URL is not configured correctly. Check VITE_API_URL in your environment.');
        }

        const apiUrl = new URL('/api/analyze', baseApi).href;
        const body = JSON.stringify({
          url: trimmedUrl,
          options: {
            ...options,
            onlyImportantLogs: true,
            debug: import.meta.env.DEV,
          },
        });

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: ctrl.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!response.ok) {
          const text = await response.text().catch(() => 'No response body');
          throw new Error(`HTTP ${response.status}: ${text}`);
        }

        const data = await response.json();
        if (data?.error) throw new Error(data.error);

        const {
          title = 'Untitled Page',
          html = '',
          screenshot = '',
          logs = [],
          requests = [],
          performance = { domContentLoaded: -1, load: -1 },
          warning = null,
          webSocket = null,
        } = data;

        const formattedResult = {
          title,
          html,
          screenshot,
          logs: Array.isArray(logs) ? logs : [],
          requests: Array.isArray(requests) ? requests : [],
          performance: typeof performance === 'object' ? performance : { domContentLoaded: -1, load: -1 },
          warning,
          webSocket,
        };

        setResult(formattedResult);

        // Optional: listen for live updates via WebSocket
        if (webSocket?.url) {
          const socket = new WebSocket(webSocket.url);
          socket.onmessage = (event) => {
            try {
              const liveUpdate = JSON.parse(event.data);
              if (liveUpdate.logs || liveUpdate.requests) {
                setResult((prev) => ({
                  ...prev,
                  logs: [...(prev?.logs || []), ...(liveUpdate.logs || [])],
                  requests: [...(prev?.requests || []), ...(liveUpdate.requests || [])],
                }));
              }
            } catch {}
          };
        }

        return formattedResult;
      } catch (err) {
        const message =
          err.name === 'AbortError'
            ? 'Request timed out'
            : typeof err.message === 'string'
              ? err.message
              : 'Unexpected error';
        if (attempt === retryLimit) {
          setError(friendlyError(message));
          setResult(null);
          console.error('Analysis error:', { message: err.message, stack: err.stack, url: trimmedUrl, options });
          return null;
        }
        await new Promise((res) => setTimeout(res, 500 + attempt * 500)); // Backoff
      } finally {
        setLoading(false);
        setController(null);
      }

      attempt++;
    }
  };

  // Optional auto-refresh (polling)
  const startPolling = (url, options = {}, interval = 60000) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      analyze(url, options);
    }, interval);
  };

  const stopPolling = () => {
    clearInterval(pollRef.current);
    pollRef.current = null;
  };

  useEffect(() => {
    return () => stopPolling(); // Cleanup on unmount
  }, []);

  return {
    analyze,
    cancel,
    loading,
    error,
    result,
    startPolling,
    stopPolling,
  };
}