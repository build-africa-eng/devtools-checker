import ConsoleLog from '../components/ConsoleLog';

function ConsoleView({ logs }) {
  return (
    <div className="space-y-2">
      {logs.length === 0 ? (
        <p className="text-gray-500 text-center">No logs available</p>
      ) : (
        logs.map((log, index) => <ConsoleLog key={index} log={log} />)
      )}
    </div>
  );
}

export default ConsoleView;