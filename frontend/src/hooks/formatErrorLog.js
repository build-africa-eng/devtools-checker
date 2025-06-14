export function formatErrorLog(event) {
  return event.filename
    ? `Failed to load resource: ${event.filename} (Error: ${event.message})`
    : `Error: ${event.message}`;
}