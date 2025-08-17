"use client";

import {
  IconFilter,
  IconSearch,
  IconUserPlus,
  IconChevronLeft,
  IconX,
  IconPlus,
  IconCheck,
  IconEdit,
  IconTrash,
  IconClipboardList,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { Task, TaskStatus, TaskPriority, TaskCategory, TaskComplexity } from "@/types/task";

interface Developer {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  position: string;
  lastActivity?: string;
}

interface Department {
  name: string;
  display_name: string;
}

// Utility function for better time formatting
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

// Utility function to get status color
const getStatusIndicator = (status: TaskStatus) => {
  const indicators = {
    available: { bg: 'bg-green-500', text: 'text-green-400', label: 'Available' },
    assigned: { bg: 'bg-blue-500', text: 'text-blue-400', label: 'Assigned' },
    in_progress: { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'In Progress' },
    completed: { bg: 'bg-purple-500', text: 'text-purple-400', label: 'Completed' },
    blocked: { bg: 'bg-red-500', text: 'text-red-400', label: 'Blocked' }
  };
  return indicators[status] || indicators.available;
};

export default function TaskPoolPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "date" | "department">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState({
    department: "",
    complexity: "",
    category: "",
    status: "!completed",
    priority: "",
  });
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Try to load from cache first
    const cachedData = localStorage.getItem('taskPoolData');
    if (cachedData) {
      try {
        const { tasks, developers, departments, timestamp } = JSON.parse(cachedData);
        
        // Only use cache if it's less than 5 minutes old
        const cacheAge = Date.now() - timestamp;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (cacheAge < fiveMinutes) {
          console.log('Using cached data');
          setTasks(tasks);
          setDevelopers(developers);
          setDepartmentsList(departments);
          setLoading(false);
          
          // Fetch fresh data in the background
          fetchData(true);
          return;
        }
      } catch (err) {
        console.error('Error parsing cached data:', err);
      }
    }
    
    // No valid cache, fetch fresh data
    fetchData();
  }, []);

  const fetchData = async (isBackgroundFetch = false) => {
    if (!isBackgroundFetch) {
      setLoading(true);
    }
    
    try {
      // Try up to 3 times with a short delay between attempts
      let tasksRes, devsRes, deptsRes;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          [tasksRes, devsRes, deptsRes] = await Promise.all([
            fetch("/api/admin/tasks?limit=1000"),
            fetch("/api/admin/developers"),
            fetch("/api/admin/departments"),
          ]);
          
          // If all requests are successful, break out of the retry loop
          if (tasksRes.ok && devsRes.ok && deptsRes.ok) {
            break;
          }
          
          // If we get here, at least one request failed
          console.log(`Attempt ${attempts + 1} failed, retrying...`);
          attempts++;
          
          // Wait a bit before retrying (increasing delay with each attempt)
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500 * attempts));
          }
        } catch (err) {
          console.error(`Error during fetch attempt ${attempts + 1}:`, err);
          attempts++;
          
          // Wait a bit before retrying
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500 * attempts));
          }
        }
      }
      
      // If we've exhausted all attempts and still don't have successful responses
      if (!tasksRes?.ok || !devsRes?.ok) {
        throw new Error("Failed to fetch data after multiple attempts");
      }

      const tasksData = await tasksRes.json();
      const devsData = await devsRes.json();
      
      let departmentsData: Department[] = [];
      if (deptsRes?.ok) {
        departmentsData = await deptsRes.json();
        setDepartmentsList(departmentsData);
      }

      const validStatuses = [
        "available",
        "assigned",
        "in_progress",
        "completed",
        "blocked",
      ] as const;

      const validCategories = [
        "NEW_FEATURE",
        "BUG_FIX",
        "INTEGRATION",
        "AUTOMATION",
        "OPTIMIZATION",
        "ENHANCEMENT",
        "LOCALIZATION",
        "DOCUMENTATION"
      ] as const;

      // Extract tasks from API response (API returns { tasks: [...], pagination: {...} })
      const tasksArray = tasksData?.tasks || tasksData || [];
      const mappedTasks = Array.isArray(tasksArray) ? tasksArray.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        department: task.department,
        compensation: task.compensation,
        status: (validStatuses.includes(task.status) ? task.status : "available") as TaskStatus,
        priority: (task.priority || "medium") as TaskPriority,
        category: (validCategories.includes(task.category) ? task.category : "NEW_FEATURE") as TaskCategory,
        complexity: (task.complexity || "medium") as TaskComplexity,
        estimated_time: task.estimated_time || 0,
        requirements: task.requirements || [],
        acceptance_criteria: task.acceptance_criteria || [],
        updatedAt: task.updated_at || task.updatedAt || new Date().toISOString(),
        start_date: task.start_date || new Date().toISOString(),
        due_date: task.due_date || new Date().toISOString(),
        department_display_name: task.department_display_name || task.department,
        environment_variables: task.environment_variables || {},
        assignedDeveloper: task.assignedDeveloper,
        assignmentDate: task.assignmentDate,
        lastUpdate: task.lastUpdate
      })) satisfies Task[] : [] as Task[];
      
      setTasks(mappedTasks);
      setDevelopers(devsData);
      setError(null);
      
      // Cache the data
      try {
        localStorage.setItem('taskPoolData', JSON.stringify({
          tasks: mappedTasks,
          developers: devsData,
          departments: departmentsData,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Error caching data:', err);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load task pool data");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    // Show success notification
    setSuccessMessage("Task created successfully!");
    setShowSuccessNotification(true);
    
    // Close create modal
    setShowCreateModal(false);
    
    // Refresh data
    fetchData();
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 5000);
  };

  const handleTaskUpdated = () => {
    // Show success notification
    setSuccessMessage("Task updated successfully!");
    setShowSuccessNotification(true);
    
    // Close edit modal
    setShowEditModal(false);
    setSelectedTask(null);
    
    // Refresh data
    fetchData();
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 5000);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/tasks?id=${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      // Show success notification
      setSuccessMessage("Task deleted successfully!");
      setShowSuccessNotification(true);
      
      // Remove the task from the list
      setTasks(tasks.filter(task => task.id !== taskId));
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 5000);
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task");
    }
  };

  const handleUnassignTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to unassign this task? The developer will no longer be assigned to it.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/tasks/unassign-task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to unassign task");
      }

      // Show success notification
      setSuccessMessage("Task unassigned successfully!");
      setShowSuccessNotification(true);
      
      // Update the task status in the list
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: "available" as TaskStatus } : task
      ));
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 5000);
    } catch (err) {
      console.error("Error unassigning task:", err);
      setError("Failed to unassign task");
    }
  };

  const handleAssignTask = async (taskId: string, developerId: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/assign-task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          developerId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign task");
      }

      // Refresh task list
      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, status: "assigned" as TaskStatus } : task
      );
      setTasks(updatedTasks);
      setShowAssignModal(false);
      setSelectedTask(null);
    } catch (err) {
      console.error("Error assigning task:", err);
      setError("Failed to assign task");
    }
  };

  const sortTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = {
          urgent: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return sortOrder === "asc" ? -diff : diff;
      } else if (sortBy === "date") {
        const aDate = a.updatedAt ? new Date(a.updatedAt) : new Date();
        const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date();
        const diff = bDate.getTime() - aDate.getTime();
        return sortOrder === "asc" ? -diff : diff;
      } else {
        // department
        const diff = a.department.localeCompare(b.department);
        return sortOrder === "asc" ? diff : -diff;
      }
    });
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDepartment =
      !filters.department || task.department === filters.department;
    const matchesComplexity =
      !filters.complexity || task.complexity === filters.complexity;
    const matchesCategory =
      !filters.category || task.category === filters.category;
    const matchesStatus = !filters.status || 
      (filters.status === "!completed" ? task.status !== "completed" : task.status === filters.status);
    const matchesPriority =
      !filters.priority || task.priority === filters.priority;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesComplexity &&
      matchesCategory &&
      matchesStatus &&
      matchesPriority
    );
  });

  const sortedAndFilteredTasks = sortTasks(filteredTasks);

  const departments = Array.from(new Set(tasks.map((t) => t.department)));
  const categories = ["NEW_FEATURE", "BUG_FIX", "INTEGRATION", "AUTOMATION", "OPTIMIZATION"];
  const complexities = ["low", "medium", "high"];
  const priorities = ["low", "medium", "high", "urgent"];
  const statuses = [
    "available",
    "assigned",
    "in_progress",
    "completed",
    "blocked",
  ];

  // Function to open the assignment modal
  const openAssignModal = (task: Task) => {
    // Scroll to top of page when opening modal
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedTask(task);
    setShowAssignModal(true);
  };

  // Function to count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.department) count++;
    if (filters.priority) count++;
    if (filters.complexity) count++;
    if (filters.category) count++;
    if (filters.status && filters.status !== "!completed") count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen px-4">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-indigo-500 mb-3 sm:mb-4"></div>
        <p className="text-gray-400 text-sm sm:text-base text-center">Loading task pool data...</p>
        <p className="text-gray-500 text-xs sm:text-sm mt-2 text-center">This may take a moment on first load</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-4 sm:p-6 text-red-200 m-4">
        <h3 className="text-lg font-semibold mb-2">Error Loading Tasks</h3>
        <p className="text-sm sm:text-base mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm sm:text-base touch-manipulation min-h-[44px]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <Link
            href="/admin"
            className="flex items-center text-gray-400 hover:text-white transition-colors touch-manipulation py-2 sm:py-0"
          >
            <IconChevronLeft className="h-4 h-4 sm:h-5 sm:w-5 mr-1" />
            <span className="text-sm sm:text-base">Back to Dashboard</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors w-full sm:w-auto text-sm sm:text-base font-medium touch-manipulation min-h-[48px] sm:min-h-[44px]"
          >
            <IconPlus className="h-4 h-4 sm:h-5 sm:w-5" />
            <span className="sm:hidden">Create</span>
            <span className="hidden sm:inline">Create Task</span>
          </button>
        </div>
      </div>

      {/* Search and Filters - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:gap-4 bg-gray-800/30 p-3 sm:p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="w-full pl-9 sm:pl-10 pr-4 py-3 sm:py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 text-sm sm:text-base touch-manipulation"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 sm:py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation min-h-[48px] sm:min-h-[auto] relative ${
                showFilters ? 'bg-indigo-600/50 border-indigo-500/50' : ''
              }`}
            >
              <IconFilter className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              <span className="sm:hidden">
                {showFilters ? 'Hide' : 'Filters'}
                {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
              </span>
              <span className="hidden sm:inline">
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
              </span>
              {/* Active filters indicator */}
              {activeFiltersCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-gray-800"></div>
              )}
            </button>
            
            <button
              className="px-4 py-3 sm:py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation min-h-[48px] sm:min-h-[auto]"
              onClick={() => {
                setFilters({
                  department: "",
                  complexity: "",
                  category: "",
                  status: "!completed",
                  priority: "",
                });
              }}
            >
              <IconX className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sm:hidden">Clear</span>
              <span className="hidden sm:inline">Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Filters Grid - Enhanced Mobile Layout with Toggle */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-2 border-t border-gray-700/30">
            <select
              value={filters.department}
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value })
              }
              className="bg-gray-800 rounded-lg px-4 py-3 sm:py-2 text-white border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm sm:text-base touch-manipulation"
            >
              <option value="" className="text-white bg-gray-800">
                All Departments
              </option>
              {departmentsList.map((dept) => (
                <option key={dept.name} value={dept.name} className="text-white bg-gray-800">
                  {dept.display_name}
                </option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
              className="bg-gray-800 rounded-lg px-4 py-3 sm:py-2 text-white border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm sm:text-base touch-manipulation"
            >
              <option value="" className="text-white bg-gray-800">
                All Priorities
              </option>
              {priorities.map((priority) => (
                <option
                  key={priority}
                  value={priority}
                  className="text-white bg-gray-800"
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={filters.complexity}
              onChange={(e) =>
                setFilters({ ...filters, complexity: e.target.value })
              }
              className="bg-gray-800 rounded-lg px-4 py-3 sm:py-2 text-white border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm sm:text-base touch-manipulation"
            >
              <option value="" className="text-white bg-gray-800">
                All Complexities
              </option>
              {complexities.map((complexity) => (
                <option
                  key={complexity}
                  value={complexity}
                  className="text-white bg-gray-800"
                >
                  {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="bg-gray-800 rounded-lg px-4 py-3 sm:py-2 text-white border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm sm:text-base touch-manipulation"
            >
              <option value="" className="text-white bg-gray-800">
                All Categories
              </option>
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                  className="text-white bg-gray-800"
                >
                  {category.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="bg-gray-800 rounded-lg px-4 py-3 sm:py-2 text-white border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm sm:text-base touch-manipulation"
            >
              <option value="!completed" className="text-white bg-gray-800">
                Hide Completed
              </option>
              <option value="" className="text-white bg-gray-800">
                All Statuses
              </option>
              {statuses.map((status) => (
                <option
                  key={status}
                  value={status}
                  className="text-white bg-gray-800"
                >
                  {status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sort Controls - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:gap-4 bg-gray-800/30 p-3 sm:p-4 rounded-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "priority" | "date" | "department")}
              className="bg-gray-700/50 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-indigo-500 flex-1 sm:flex-none text-sm touch-manipulation"
            >
              <option value="date">Date</option>
              <option value="priority">Priority</option>
              <option value="department">Department</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors flex-shrink-0 touch-manipulation min-w-[44px]"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
          
          {/* Task Count Summary */}
          <div className="bg-gray-700/30 px-3 py-2 rounded-lg">
            <span className="text-gray-400 text-xs sm:text-sm">
              Showing <span className="text-white font-bold">{sortedAndFilteredTasks.length}</span> active tasks
            </span>
          </div>
        </div>
        
        {/* Status Statistics - Mobile Optimized */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-400 text-xs sm:text-sm font-medium">
              {tasks.filter(t => t.status === 'available').length} Available
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
            <span className="text-blue-400 text-xs sm:text-sm font-medium">
              {tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length} Active
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-500 rounded-full"></div>
            <span className="text-gray-400 text-xs sm:text-sm font-medium">
              {tasks.filter(t => t.status === 'completed').length} Completed
            </span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4 sm:space-y-6">
        {sortedAndFilteredTasks.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="bg-gray-800/30 rounded-xl p-6 sm:p-8 border border-gray-700/50">
              <IconClipboardList className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
                {tasks.length === 0 
                  ? "There are no tasks in the system yet." 
                  : "No tasks match your current filters."}
              </p>
              {tasks.length === 0 ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm sm:text-base touch-manipulation min-h-[48px]"
                >
                  Create Your First Task
                </button>
              ) : (
                <button
                  onClick={() => {
                    setFilters({
                      department: "",
                      complexity: "",
                      category: "",
                      status: "!completed",
                      priority: "",
                    });
                    setSearchQuery("");
                  }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base touch-manipulation min-h-[48px]"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
            {sortedAndFilteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-gray-800/40 rounded-xl border border-gray-700/50 hover:border-indigo-500/30 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] group"
              >
                {/* Header with Status and Priority */}
                <div className="p-3 sm:p-4 border-b border-gray-700/30">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors leading-tight">
                        {task.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {task.department_display_name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 ml-2 flex-shrink-0">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
                          task.priority === "urgent"
                            ? "bg-red-900/70 text-red-200 border-red-500/40"
                            : task.priority === "high"
                            ? "bg-orange-900/70 text-orange-200 border-orange-500/40"
                            : task.priority === "medium"
                            ? "bg-yellow-900/70 text-yellow-200 border-yellow-500/40"
                            : "bg-green-900/70 text-green-200 border-green-500/40"
                        }`}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${
                        task.status === "available"
                          ? "bg-green-900/70 text-green-200 border-green-500/40"
                          : task.status === "assigned" || task.status === "in_progress"
                          ? "bg-blue-900/70 text-blue-200 border-blue-500/40"
                          : task.status === "completed"
                          ? "bg-purple-900/70 text-purple-200 border-purple-500/40"
                          : "bg-red-900/70 text-red-200 border-red-500/40"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                        task.status === "available" ? "bg-green-400" :
                        task.status === "assigned" || task.status === "in_progress" ? "bg-blue-400" :
                        task.status === "completed" ? "bg-purple-400" : "bg-red-400"
                      }`}></div>
                      <span className="hidden sm:inline">{task.status.replace("_", " ").toUpperCase()}</span>
                      <span className="sm:hidden">{task.status === "in_progress" ? "PROGRESS" : task.status.toUpperCase()}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      #{task.id.substring(0, 8)}
                    </span>
                  </div>
                </div>

                {/* Assignment Information - Most Important for Admins */}
                {task.assignedDeveloper ? (
                  <div className="p-3 sm:p-4 bg-blue-900/10 border-b border-gray-700/30">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                        {task.assignedDeveloper.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div>
                          <p className="text-blue-200 font-medium text-xs sm:text-sm truncate">
                            {task.assignedDeveloper.name}
                          </p>
                          <p className="text-blue-300/70 text-xs">
                            {task.assignedDeveloper.position ? 
                              task.assignedDeveloper.position.charAt(0).toUpperCase() + 
                              task.assignedDeveloper.position.slice(1).replace(/_/g, ' ') 
                              : 'Developer'}
                          </p>
                        </div>
                      </div>
                      {task.assignmentDate && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-blue-300/70 text-xs">Assigned</p>
                          <p className="text-blue-200 text-xs font-medium">
                            {formatTimeAgo(task.assignmentDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 sm:p-4 bg-green-900/10 border-b border-gray-700/30">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <IconUserPlus className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-green-200 font-medium text-xs sm:text-sm">
                          Available for Assignment
                        </p>
                        <p className="text-green-300/70 text-xs">
                          Ready for developer assignment
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Details */}
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed line-clamp-2">
                    {task.description}
                  </p>

                  {/* Key Metrics Grid - Mobile Optimized */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs">
                    <div className="bg-gray-700/30 rounded-lg p-2">
                      <p className="text-gray-400 text-xs">Est. Hours</p>
                      <p className="text-white font-semibold text-xs sm:text-sm">{task.estimated_time}h</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-2">
                      <p className="text-gray-400 text-xs">Complexity</p>
                      <p className={`font-semibold text-xs sm:text-sm ${
                        task.complexity === 'high' ? 'text-red-400' :
                        task.complexity === 'medium' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {task.complexity?.charAt(0).toUpperCase() + task.complexity?.slice(1)}
                      </p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-2">
                      <p className="text-gray-400 text-xs">Category</p>
                      <p className="text-white font-semibold text-xs truncate">
                        {task.category?.replace("_", " ")}
                      </p>
                    </div>
                  </div>

                  {/* Last Update */}
                  {task.lastUpdate && (
                    <div className="bg-gray-700/20 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                            task.lastUpdate.type === 'module' ? 'bg-green-400' : 'bg-blue-400'
                          }`}></div>
                          <span className="text-gray-400 text-xs">Last Update:</span>
                        </div>
                        <span className="text-gray-400 text-xs">
                          {formatTimeAgo(task.lastUpdate.updatedAt)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Requirements Tags - Mobile Optimized */}
                  {task.requirements && task.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.requirements.slice(0, 2).map((req, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700/40 border border-gray-600/40 rounded-full text-xs text-gray-300 truncate max-w-[120px]"
                        >
                          {req}
                        </span>
                      ))}
                      {task.requirements.length > 2 && (
                        <span className="px-2 py-1 bg-gray-700/40 border border-gray-600/40 rounded-full text-xs text-gray-400">
                          +{task.requirements.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons - Mobile Optimized */}
                <div className="p-3 sm:p-4 border-t border-gray-700/30 bg-gray-800/20">
                  <div className="flex flex-col gap-2">
                    {/* Primary Actions Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/admin/tasks/${task.id}`}
                        className="py-3 sm:py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-medium touch-manipulation min-h-[44px] sm:min-h-[auto]"
                      >
                        <IconClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Details</span>
                        <span className="sm:hidden">View</span>
                      </Link>
                      
                      {task.status === "available" ? (
                        <button
                          onClick={() => openAssignModal(task)}
                          className="py-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-medium touch-manipulation min-h-[44px] sm:min-h-[auto]"
                        >
                          <IconUserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                          Assign
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnassignTask(task.id)}
                          className="py-3 sm:py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-medium touch-manipulation min-h-[44px] sm:min-h-[auto]"
                        >
                          <IconX className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Unassign</span>
                          <span className="sm:hidden">Remove</span>
                        </button>
                      )}
                    </div>
                    
                    {/* Secondary Actions Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowEditModal(true);
                        }}
                        className="py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-medium touch-manipulation min-h-[44px] sm:min-h-[auto]"
                      >
                        <IconEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="py-3 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-medium touch-manipulation min-h-[44px] sm:min-h-[auto]"
                        title="Delete Task"
                      >
                        <IconTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Modal - Mobile Optimized */}
      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex items-start justify-center p-3 sm:p-4 text-center min-h-full">
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 max-w-lg w-full mx-auto shadow-xl transform transition-all my-4 sm:my-8">
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                Assign Developer to Task
              </h2>
              <p className="text-gray-400 mb-4 text-sm sm:text-base truncate">{selectedTask.title}</p>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 sm:pr-2">
                {developers.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => handleAssignTask(selectedTask.id, dev.id)}
                    className="w-full p-3 sm:p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-left transition-colors touch-manipulation min-h-[60px]"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                          {dev.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm sm:text-base truncate">{dev.name}</p>
                          <p className="text-gray-400 text-xs sm:text-sm">
                            {dev.position ? 
                              dev.position.charAt(0).toUpperCase() + dev.position.slice(1).replace(/_/g, ' ') 
                              : 'Developer'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2 ${
                          dev.status === "active"
                            ? "bg-green-900/50 text-green-300 border border-green-500/20"
                            : "bg-gray-900/50 text-gray-300 border border-gray-500/20"
                        }`}
                      >
                        {dev.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTask(null);
                  }}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/30 touch-manipulation min-h-[48px] sm:min-h-[auto] text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <EditTaskModal
          task={selectedTask}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTask(null);
          }}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* Success Notification - Mobile Optimized */}
      {showSuccessNotification && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-4 sm:right-4 sm:left-auto sm:w-auto bg-green-800 text-white p-4 rounded-lg shadow-lg flex items-center z-50">
          <IconCheck className="mr-2 flex-shrink-0 w-5 h-5" />
          <span className="flex-1 text-sm sm:text-base">{successMessage}</span>
          <button 
            className="ml-4 text-white/70 hover:text-white flex-shrink-0 p-1 touch-manipulation" 
            onClick={() => setShowSuccessNotification(false)}
          >
            <IconX className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
