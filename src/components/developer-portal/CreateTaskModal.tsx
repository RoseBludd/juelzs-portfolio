import { IconX } from "@tabler/icons-react";
import { useState } from "react";

interface CreateTaskModalProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

type Priority = "low" | "medium" | "high" | "urgent";

const CreateTaskModal = ({ onClose, onTaskCreated }: CreateTaskModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [department, setDepartment] = useState("");
  const [compensation, setCompensation] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [similarTasks, setSimilarTasks] = useState<any[]>([]);

  const analyzeTask = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/admin/tasks/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze task");
      }

      const data = await response.json();
      setSimilarityScore(data.similarityScore);
      setSimilarTasks(data.similarTasks || []);
    } catch (error) {
      console.error("Error analyzing task:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          department,
          compensation: parseFloat(compensation),
          estimated_time: parseFloat(estimatedTime),
          status: "available",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      onTaskCreated();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IconX className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 h-32"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Compensation ($)
              </label>
              <input
                type="number"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estimated Time (hours)
              </label>
              <input
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                required
                min="0"
                step="0.5"
              />
            </div>
          </div>

          {/* NLP Analysis Section */}
          <div className="border-t border-gray-700 pt-6">
            <button
              type="button"
              onClick={analyzeTask}
              disabled={!title || !description || analyzing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? "Analyzing..." : "Analyze Task"}
            </button>

            {similarityScore !== null && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-white mb-2">
                  Analysis Results
                </h3>
                <p className="text-gray-300">
                  Similarity Score: {(similarityScore * 100).toFixed(1)}%
                </p>
                {similarTasks.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-white mb-2">
                      Similar Tasks:
                    </h4>
                    <ul className="space-y-2">
                      {similarTasks.map((task) => (
                        <li
                          key={task.id}
                          className="p-3 bg-gray-700/50 rounded-lg"
                        >
                          <p className="text-white font-medium">{task.title}</p>
                          <p className="text-gray-400 text-sm mt-1">
                            {task.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal; 