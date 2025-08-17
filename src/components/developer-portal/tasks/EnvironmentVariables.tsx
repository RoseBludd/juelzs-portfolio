interface EnvironmentVariablesProps {
  environmentVariables: Record<string, string>;
}

export const EnvironmentVariables = ({ environmentVariables }: EnvironmentVariablesProps) => {
  if (!environmentVariables || Object.keys(environmentVariables).length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Environment Variables</h2>
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(environmentVariables).map(([key, value]) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 px-4 bg-gray-800/50 rounded-lg gap-2">
              <span className="text-indigo-400 font-mono text-sm break-all">{key}</span>
              <span className="text-gray-300 font-mono text-sm break-all">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 