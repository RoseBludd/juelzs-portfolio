import { IconX, IconArrowLeft } from "@tabler/icons-react";
import { useState, useEffect } from "react";

import { TaskPriority, TaskCategory, TaskComplexity } from "@/types/task";

import { EnvironmentVariablesEditor } from "./EnvironmentVariablesEditor";

interface CreateTaskModalProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

interface Department {
  name: string;
  display_name: string;
}

const VideoFields = ({ hasVideo, setHasVideo, loomVideoUrl, setLoomVideoUrl, transcript, setTranscript }: {
  hasVideo: boolean;
  setHasVideo: (value: boolean) => void;
  loomVideoUrl: string;
  setLoomVideoUrl: (value: string) => void;
  transcript: string;
  setTranscript: (value: string) => void;
}) => (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium text-gray-300">Include Video Explanation</label>
      <button
        type="button"
        onClick={() => {
          setHasVideo(!hasVideo);
          if (!hasVideo) {
            setLoomVideoUrl("");
            setTranscript("");
          }
        }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          hasVideo ? 'bg-indigo-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            hasVideo ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
    {hasVideo && (
      <>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Loom Video URL</label>
          <input
            type="url"
            value={loomVideoUrl}
            onChange={(e) => setLoomVideoUrl(e.target.value)}
            placeholder="Paste your Loom video URL here"
            className="w-full bg-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Transcript</label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the video transcript here"
            className="w-full bg-gray-700 text-white rounded-xl px-4 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </>
    )}
  </div>
);

export const CreateTaskModal = ({ onClose, onTaskCreated }: CreateTaskModalProps) => {
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [complexity, setComplexity] = useState<TaskComplexity>("medium");
  const [category, setCategory] = useState<TaskCategory>("NEW_FEATURE");
  const [department, setDepartment] = useState<string>("");
  const [compensation, setCompensation] = useState<number>(250);
  const [estimatedTime, setEstimatedTime] = useState<number>(20);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"ai" | "manual">("ai"); // Track which mode is active
  const [hasVideo, setHasVideo] = useState(false);
  const [loomVideoUrl, setLoomVideoUrl] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  const [analyzedTask, setAnalyzedTask] = useState<{
    title: string;
    optimizedDescription: string;
    requirements: string[];
    acceptanceCriteria: string[];
    suggestedCompensation: number;
    estimatedTime: number;
  } | null>(null);
  const [environmentVariables, setEnvironmentVariables] = useState<Record<string, string>>({});

  // Update compensation and time estimates when complexity changes
  useEffect(() => {
    if (complexity === "high") {
      setCompensation(500);
      setEstimatedTime(40);
    } else if (complexity === "medium") {
      setCompensation(250);
      setEstimatedTime(25);
    } else {
      setCompensation(100);
      setEstimatedTime(15);
    }
    
    // Adjust for integration tasks
    if (category === "INTEGRATION") {
      if (complexity === "high") {
        setEstimatedTime(50);
      } else if (complexity === "medium") {
        setEstimatedTime(30);
      } else {
        setEstimatedTime(20);
      }
    }
  }, [complexity, category]);

  useEffect(() => {
    // Fetch departments when component mounts
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/admin/departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
          if (data.length > 0) {
            setDepartment(data[0].name); // Set first department as default
          }
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setErrorMessage("Failed to load departments");
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !transcript.trim()) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    
    // Combine description and transcript for analysis
    const fullDescription = [
      description.trim(),
      hasVideo && transcript.trim() ? `\n\nVideo Transcript:\n${transcript.trim()}` : ""
    ].filter(Boolean).join("");
    
    try {
      const response = await fetch("/api/admin/tasks/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: fullDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze task");
      }

      const analysisData = await response.json();
      setAnalyzedTask(analysisData);
    } catch (error) {
      console.error("Error analyzing task:", error);
      setErrorMessage("Failed to analyze task");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreate = async () => {
    if (!analyzedTask) return;

    setIsCreating(true);
    setErrorMessage(null);
    try {
      // Prepare video-related fields only if hasVideo is true and URL is provided
      const videoFields = hasVideo && loomVideoUrl ? {
        loom_video_url: loomVideoUrl,
        transcript: transcript || ""
      } : {};

      const createResponse = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: analyzedTask.title,
          description: analyzedTask.optimizedDescription,
          priority,
          complexity,
          category,
          department,
          compensation: analyzedTask.suggestedCompensation.toString(),
          estimated_time: analyzedTask.estimatedTime,
          requirements: analyzedTask.requirements,
          acceptance_criteria: analyzedTask.acceptanceCriteria,
          status: "available",
          environment_variables: environmentVariables,
          ...videoFields
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      const createdTask = await createResponse.json();
      console.log("Task created successfully:", createdTask);
      
      onTaskCreated();
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  const handleManualCreate = async () => {
    if (!title || !description) {
      setErrorMessage("Title and description are required");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);
    try {
      // Prepare video-related fields only if hasVideo is true and URL is provided
      const videoFields = hasVideo && loomVideoUrl ? {
        loom_video_url: loomVideoUrl,
        transcript: transcript || ""
      } : {};

      const createResponse = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          complexity,
          category,
          department,
          compensation: compensation.toString(),
          estimated_time: estimatedTime,
          status: "available",
          environment_variables: environmentVariables,
          ...videoFields
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      onTaskCreated();
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="relative bg-gray-800 rounded-xl p-6 max-w-2xl w-full my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IconX className="h-6 w-6" />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-4 mb-4 text-red-200">
            {errorMessage}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">
            {mode === "ai" ? "AI Analysis" : "Manual Task Creation"}
          </h3>
          <button
            type="button"
            onClick={() => setMode(mode === "ai" ? "manual" : "ai")}
            className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center"
          >
            {mode === "ai" ? (
              "Switch to Manual Creation"
            ) : (
              <>
                <IconArrowLeft className="mr-1 h-4 w-4" />
                Back to AI Analysis
              </>
            )}
          </button>
        </div>

        {/* Environment Variables Section - Moved outside mode-specific sections */}
        <div className="mb-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <EnvironmentVariablesEditor
            value={environmentVariables}
            onChange={setEnvironmentVariables}
          />
        </div>

        {/* AI Analysis Mode */}
        {mode === "ai" && (
          <div>
            <p className="text-gray-400 text-sm mb-4">
              Let AI analyze your task description or transcript to generate requirements and acceptance criteria.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Task Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the task in detail. Be specific about requirements and goals."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 h-48"
                  disabled={isAnalyzing}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                  <input
                    type="checkbox"
                    checked={hasVideo}
                    onChange={(e) => setHasVideo(e.target.checked)}
                    className="rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span>Include Video Explanation</span>
                </label>

                {hasVideo && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Loom Video URL
                      </label>
                      <input
                        type="url"
                        value={loomVideoUrl}
                        onChange={(e) => setLoomVideoUrl(e.target.value)}
                        placeholder="Paste your Loom video URL here"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Video Transcript
                      </label>
                      <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Paste the video transcript here for AI analysis"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 h-48"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isAnalyzing || (!description.trim() && (!hasVideo || !transcript.trim()))}
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  "Analyze Task"
                )}
              </button>

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  <p className="text-gray-300">Analyzing task and generating requirements...</p>
                </div>
              ) : analyzedTask ? (
                <div className="space-y-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Analysis Results</h3>
                    <div className="mb-4">
                      <span className="text-sm text-gray-400">Title:</span>
                      <p className="text-white font-medium">{analyzedTask.title}</p>
                    </div>
                    <div className="text-gray-300">{analyzedTask.optimizedDescription}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Key Requirements</h4>
                      <ul className="space-y-2">
                        {analyzedTask.requirements.map((req, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-indigo-400 mr-2">•</span>
                            <span className="text-gray-300 text-sm">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Acceptance Criteria</h4>
                      <ul className="space-y-2">
                        {analyzedTask.acceptanceCriteria.map((criteria, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            <span className="text-gray-300 text-sm">{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TaskCategory)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="NEW_FEATURE">New Feature</option>
                        <option value="INTEGRATION">Integration</option>
                        <option value="AUTOMATION">Automation</option>
                        <option value="BUG_FIX">Bug Fix</option>
                        <option value="ENHANCEMENT">Enhancement</option>
                        <option value="LOCALIZATION">Localization</option>
                        <option value="DOCUMENTATION">Documentation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Complexity
                      </label>
                      <select
                        value={complexity}
                        onChange={(e) => setComplexity(e.target.value as TaskComplexity)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-700 pt-4 mt-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-sm text-gray-400">Compensation</span>
                        <p className="text-xl font-semibold text-white">${analyzedTask.suggestedCompensation}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Est. Time</span>
                        <p className="text-xl font-semibold text-white">{analyzedTask.estimatedTime}h</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreate}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      "Create Task"
                    )}
                  </button>
                </div>
              ) : null}
            </form>
          </div>
        )}

        {/* Manual Creation Mode */}
        {mode === "manual" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task in detail"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 h-32"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="NEW_FEATURE">New Feature</option>
                  <option value="INTEGRATION">Integration</option>
                  <option value="AUTOMATION">Automation</option>
                  <option value="BUG_FIX">Bug Fix</option>
                  <option value="ENHANCEMENT">Enhancement</option>
                  <option value="LOCALIZATION">Localization</option>
                  <option value="DOCUMENTATION">Documentation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Complexity
                </label>
                <select
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value as TaskComplexity)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
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
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  {departments.map((dept) => (
                    <option key={dept.name} value={dept.name}>
                      {dept.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Compensation ($)
                </label>
                <input
                  type="number"
                  value={compensation}
                  onChange={(e) => setCompensation(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  min="100"
                  step="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estimated Time (hours)
                </label>
                <input
                  type="number"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  min="5"
                  step="5"
                />
              </div>
            </div>

            <VideoFields
              hasVideo={hasVideo}
              setHasVideo={setHasVideo}
              loomVideoUrl={loomVideoUrl}
              setLoomVideoUrl={setLoomVideoUrl}
              transcript={transcript}
              setTranscript={setTranscript}
            />

            <button
              type="button"
              onClick={handleManualCreate}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isCreating || !title || !description}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 