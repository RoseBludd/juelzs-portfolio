import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState, useEffect } from "react";

interface EnvVar {
  key: string;
  value: string;
}

interface EnvironmentVariablesEditorProps {
  value: Record<string, string>;
  onChange: (envVars: Record<string, string>) => void;
}

export const EnvironmentVariablesEditor = ({ value, onChange }: EnvironmentVariablesEditorProps) => {
  console.log('EnvironmentVariablesEditor mounted/updated with value:', value);
  
  const [envVars, setEnvVars] = useState<EnvVar[]>(() => {
    console.log('Initializing envVars state with value:', value);
    if (value && Object.keys(value).length > 0) {
      const initialArray = Object.entries(value).map(([key, value]) => ({ key, value }));
      console.log('Initial array:', initialArray);
      return initialArray;
    }
    return [];
  });

  useEffect(() => {
    console.log('Value changed in EnvironmentVariablesEditor:', value);
    console.log('Current envVars state:', envVars);
    
    if (value && Object.keys(value).length > 0) {
      const envVarArray = Object.entries(value).map(([key, value]) => ({ key, value }));
      console.log('Converting value to array:', envVarArray);
      setEnvVars(envVarArray);
    } else {
      console.log('No environment variables in value prop, setting empty array');
      setEnvVars([]);
    }
  }, [value]);

  const handleAddVariable = () => {
    console.log('Adding new variable');
    const newEnvVars = [...envVars, { key: "", value: "" }];
    console.log('New env vars after adding:', newEnvVars);
    setEnvVars(newEnvVars);
    
    // Don't update parent until the key is filled out
    // This prevents empty keys from being added to the parent state
    const validVars = newEnvVars.filter(v => v.key.trim());
    if (validVars.length > 0) {
      updateParent(newEnvVars);
    }
  };

  const handleRemoveVariable = (index: number) => {
    console.log('Removing variable at index:', index);
    const newEnvVars = envVars.filter((_, i) => i !== index);
    setEnvVars(newEnvVars);
    updateParent(newEnvVars);
  };

  const handleVariableChange = (index: number, field: "key" | "value", newValue: string) => {
    console.log(`Updating ${field} at index ${index} to:`, newValue);
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = newValue;
    setEnvVars(newEnvVars);
    
    // Only update parent if we have valid keys
    const validVars = newEnvVars.filter(v => v.key.trim());
    if (validVars.length > 0) {
      updateParent(newEnvVars);
    }
  };

  const updateParent = (vars: EnvVar[]) => {
    // Convert array back to object and trigger onChange
    const envVarObject = vars.reduce((acc, { key, value }) => {
      if (key.trim()) {
        acc[key.trim()] = value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    console.log('Updating parent with:', envVarObject);
    onChange(envVarObject);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-300">
          Environment Variables
        </label>
        <button
          type="button"
          onClick={handleAddVariable}
          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm flex items-center gap-1"
        >
          <IconPlus size={16} />
          Add Variable
        </button>
      </div>
      
      <div className="space-y-2">
        {envVars.map((envVar, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="text"
                value={envVar.key}
                onChange={(e) => handleVariableChange(index, "key", e.target.value)}
                placeholder="Variable name"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={envVar.value}
                onChange={(e) => handleVariableChange(index, "value", e.target.value)}
                placeholder="Value"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveVariable(index)}
              className="px-2 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-200 rounded-lg"
            >
              <IconTrash size={16} />
            </button>
          </div>
        ))}
      </div>
      
      {envVars.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No environment variables defined
        </p>
      )}
    </div>
  );
}; 