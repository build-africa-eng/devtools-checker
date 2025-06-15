import { useEffect, useRef, useState } from 'react';

export function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [controller, setController] = useState(null);
  const pollRef = useRef(null);
  const wsRef = useRef(null);
  const retryLimit = 2;

  // Friendly error messages for UI
  const friendlyError = (msg = '') => {
    const m = msg.toLowerCase();
    if (m.includes('failed to fetch')) return 'Cannot connect to the server.';
    if (m.includes('timeout') || m.includes('timed out')) return 'The analysis request timed out.';
    if (m.includes('network')) return 'Network error. Check your connection.';
    if (m.includes('invalid json')) return 'Invalid response from server.';
    if (m.includes('failed to launch browser')) return 'Failed to start browser for analysis. Server busy or misconfigured.';
    if (m.includes('a valid url is required')) return 'Please enter a valid URL.';
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
      // <-- MODIFIED: Increased client-side timeout to match overall backend timeout
      const timeoutId = setTimeout(() => ctrl.abort(), 185000); // Slightly more than backend (3 min + 5 sec buffer)

      setLoading(true);
      setError(null);
      setResult(null);
      cleanupWebSocket();

      try {
        const baseApi = import.meta.env.VITE_API_URL;
        if (!baseApi || !validateUrl(baseApi)) {
          throw { name: 'ConfigurationError', message: 'Invalid or missing API URL. Check VITE_API_URL.' }; // <-- Throw richer error
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
              debug: import.meta.env.DEV, // Pass debug flag based on frontend env
            },
          }),
          signal: ctrl.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText); // Try to parse as JSON
            throw { // <-- Throw a richer error object if backend sent JSON error
              name: 'BackendHttpError',
              message: errorData.message || 'Unknown backend HTTP error',
              details: errorData.details || errorText, // Use details if present, otherwise raw text
              httpStatus: response.status,
              backendErrorType: errorData.error, // The 'error' field from backend
            };
          } catch (parseErr) {
            // Not JSON, just plain text error from backend
            throw { // <-- Throw a richer error object for non-JSON backend errors
              name: 'BackendHttpError',
              message: `HTTP ${response.status}: ${errorText}`,
              httpStatus: response.status,
              details: errorText, // Raw text as details
            };
          }
        }

        let data;
        try {
          data = await response.json(); // <-- This parses the successful or error-wrapped JSON
        } catch (err) {
          const raw = await response.text();
          throw { // <-- Throw a richer error object for JSON parsing failure
            name: 'JsonParseError',
            message: `Failed to parse JSON response: ${err.message}`,
            details: raw, // Raw response body is very helpful for debugging
          };
        }

        if (data?.error) { // This catches backend errors that return 200 OK but with an error field
          throw { // <-- Throw a richer error object for backend's internal errors
            name: 'BackendApplicationError',
            message: data.message || data.error, // Use message field if backend provides it, otherwise data.error
            details: data.details || null, // Pass along backend's details/stack
            backendErrorType: data.error, // Original 'error' field from backend
          };
        }

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
          logs: Array.isArray(logs) ? logs : [], // Now contains rich console log objects
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
              // Append new logs/requests from WebSocket
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

          socket.onerror = (event) => {
            if (import.meta.env.DEV) {
              console.error('WebSocket error:', event);
            }
          };
          socket.onclose = (event) => {
            if (import.meta.env.DEV && !event.wasClean) {
                console.warn('WebSocket closed unexpectedly:', event);
            }
            wsRef.current = null;
          };
        }

        return parsedResult;
      } catch (errFromTry) { // <-- MODIFIED: Renamed error to differentiate from retry loop
        if (attempt === retryLimit) {
          let displayMessage = friendlyError(errFromTry.message || 'An unknown error occurred');
          let logMessage = errFromTry.message || 'An unknown error occurred'; // Default log message
          let logDetails = errFromTry.stack; // Default to stack for JavaScript errors

          // <-- MODIFIED: Enhanced logging for different error types
          if (errFromTry.name === 'AbortError') {
            displayMessage = 'Request timed out (client-side).';
            logMessage = 'Client-side fetch request aborted/timed out.';
            logDetails = 'The request did not receive a response within the configured time.';
          } else if (errFromTry.name === 'ConfigurationError') {
              displayMessage = friendlyError(errFromTry.message);
              logMessage = `Configuration Error: ${errFromTry.message}`;
              logDetails = errFromTry.stack;
          } else if (errFromTry.name === 'BackendHttpError') {
            displayMessage = friendlyError(errFromTry.message);
            logMessage = `Backend HTTP Error (${errFromTry.httpStatus}): ${errFromTry.message}`;
            logDetails = errFromTry.details; // From backend response
          } else if (errFromTry.name === 'JsonParseError') {
            displayMessage = friendlyError(errFromTry.message);
            logMessage = `JSON Parsing Error: ${errFromTry.message}`;
            logDetails = `Raw Response: ${errFromTry.details}`; // Raw response body
          } else if (errFromTry.name === 'BackendApplicationError') {
            displayMessage = friendlyError(errFromTry.message);
            logMessage = `Backend Application Error: ${errFromTry.message} (Type: ${errFromTry.backendErrorType})`;
            logDetails = errFromTry.details; // From backend response (e.g., stack trace)
          } else if (errFromTry.name === 'PuppeteerLaunchError') { // Catch specific Puppeteer errors
            displayMessage = friendlyError(errFromTry.message);
            logMessage = `Puppeteer Launch Error: ${errFromTry.message}`;
            logDetails = errFromTry.details;
          }

          setError(displayMessage);
          setResult(null);

          if (import.meta.env.DEV) { // Only log full details in development
            console.error('useAnalysis Error (Frontend):', logMessage);
            if (logDetails) {
              console.error('Details:', logDetails);
            }
            // Log the full original error object for deep debugging
            console.error('Original Error Object:', errFromTry);
          }
          return null; // Return null on final failure
        }
        await new Promise((res) => setTimeout(res, 500 + attempt * 500)); // Retry delay
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
      cancel(); // Ensure cleanup on unmount
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