import { useEffect, useRef, useState } from 'react';

export function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [controller, setController] = useState(null);
  const pollRef = useRef(null);
  const wsRef = useRef(null);
  const retryLimit = 2;

  const friendlyError = (msg = '') => {
    const m = msg.toLowerCase();
    if (m.includes('failed to fetch')) return 'Cannot connect to the server.';
    if (m.includes('timeout')) return 'The analysis request timed out.';
    if (m.includes('network')) return 'Network error. Check your connection.';
    if (m.includes('unexpected token')) return 'Invalid JSON from server.';
    return msg || 'An unknown error occurred.';
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const cleanupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const cancel = () => {
    if (controller) controller.abort?.();
    cleanupWebSocket();
    stopPolling();
  };

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
      cleanupWebSocket();

      try {
        const baseApi = import.meta.env.VITE_API_URL;
        if (!baseApi || !validateUrl(baseApi)) {
          throw new Error('Invalid or missing API URL. Check VITE_API_URL.');
        }

        const apiUrl = new URL('/api/analyze', baseApi).href;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: trimmedUrl,
            options: {
              ...options,
              onlyImportantLogs: true,
              debug: import.meta.env.DEV,
            },
          }),
          signal: ctrl.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }

        let data;
        try {
          data = await response.json();
        } catch (err) {
          const raw = await response.text();
          throw new Error(`Failed to parse JSON: ${err.message}\nRaw: ${raw}`);
        }

        if (data?.error) throw new Error(data.error);

        const {
          title = 'Untitled Page',
          html = '',
          screenshot = '',
          logs = [],
          requests = [],
          performance = {},
          domMetrics = {},
          warning = null,
          webSocket = null,
        } = data;

        const parsedResult = {
          title,
          html,
          screenshot,
          logs: Array.isArray(logs) ? logs : [],
          requests: Array.isArray(requests) ? requests : [],
          performance,
          domMetrics,
          warning,
          webSocket,
        };

        setResult(parsedResult);

        // Set up WebSocket
        if (webSocket?.url) {
          const socket = new WebSocket(webSocket.url);
          wsRef.current = socket;

          socket.onmessage = (e) => {
            try {
              const msg = JSON.parse(e.data);
              if (msg.logs || msg.requests) {
                setResult((prev) => ({
                  ...prev,
                  logs: [...(prev?.logs || []), ...(msg.logs || [])],
                  requests: [...(prev?.requests || []), ...(msg.requests || [])],
                }));
              }
            } catch {
              if (import.meta.env.DEV) {
                console.warn('Bad WebSocket message:', e.data);
              }
            }
          };

          socket.onerror = () => {};
          socket.onclose = () => {
            wsRef.current = null;
          };
        }

        return parsedResult;
      } catch (err) {
        if (attempt === retryLimit) {
          const msg = err.name === 'AbortError' ? 'Request timed out' : err.message;
          setError(friendlyError(msg));
          setResult(null);
          if (import.meta.env.DEV) {
            console.error('useAnalysis error:', msg);
          }
          return null;
        }
        await new Promise((res) => setTimeout(res, 500 + attempt * 500));
      } finally {
        setLoading(false);
        setController(null);
      }

      attempt++;
    }
  };

  const startPolling = (url, options = {}, interval = 60000) => {
    stopPolling();
    pollRef.current = setInterval(() => analyze(url, options), interval);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupWebSocket();
      stopPolling();
    };
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