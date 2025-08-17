export interface DashboardTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  department: string;
  complexity: string;
  createdAt: string;
  updatedAt: string;
  notes?: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
} 
