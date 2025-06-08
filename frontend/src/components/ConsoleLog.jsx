function ConsoleLog({ log }) {
  const color = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
    log: 'text-gray-400',
  }[log.type] || 'text-gray-400';

  return (
    <div className="p-2 border-b border-gray-700">
      <p className={color}>{log.type.toUpperCase()}: {log.text}</p>
      {log.location?.url && <p className="text-xs text-gray-500">{log.location.url}</p>}
    </div>
  );
}

export default ConsoleLog;