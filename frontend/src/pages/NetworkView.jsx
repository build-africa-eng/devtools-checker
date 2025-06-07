import NetworkEntry from '../components/NetworkEntry';

function NetworkView({ requests }) {
  return (
    <div className="space-y-2">
      {requests.length === 0 ? (
        <p className="text-gray-500 text-center">No requests available</p>
      ) : (
        requests.map((req, index) => <NetworkEntry key={index} request={req} />)
      )}
    </div>
  );
}

export default NetworkView;