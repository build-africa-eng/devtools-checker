function NetworkEntry({ request }) {
  const statusColor = request.status >= 400 ? 'text-red-500' : 'text-green-500';

  return (
    <div className="p-2 border-b border-gray-700">
      <p className={statusColor}>
        {request.method} {request.status || 'Pending'} - {request.url}
      </p>
      <p className="text-xs text-gray-500">{request.resourceType}</p>
    </div>
  );
}

export default NetworkEntry;