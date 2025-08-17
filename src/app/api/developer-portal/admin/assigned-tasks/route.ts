import { NextResponse } from 'next/server';

// Create mock data that matches what we see in the UI already
const mockTasks = [
  {
    id: "1",
    title: "Integrate AWS WorkMail with Sales Dashboard for Email Functionality",
    description: "Connect AWS WorkMail service with the sales dashboard to enable email notifications and communications directly from the dashboard.",
    status: "in_progress",
    priority: "medium",
    department: "Sales",
    department_display_name: "Sales",
    assigned_developers: "Junniel Rome Ardepuela",
    milestones: [
      {
        id: "m1",
        title: "Initial Setup and Requirements Analysis",
        description: "Gather requirements and set up development environment.",
        status: "completed",
        completion_percentage: 100,
        order_index: 0,
        updates: []
      },
      {
        id: "m2",
        title: "AWS WorkMail API Integration",
        description: "Implement the core API integration with AWS WorkMail.",
        status: "in_progress",
        completion_percentage: 50,
        order_index: 1,
        updates: [
          {
            id: "u1",
            update_type: "status_update",
            content: "Started working on the API integration, making good progress.",
            created_at: new Date().toISOString(),
            developer_id: "dev1",
            developer_name: "Junniel Rome Ardepuela"
          }
        ]
      },
      {
        id: "m3",
        title: "UI Implementation and Testing",
        description: "Implement the user interface and test the integration.",
        status: "pending",
        completion_percentage: 0,
        order_index: 2,
        updates: []
      }
    ],
    total_milestones: 3,
    milestones_completed: 1,
    milestone_progress: 50
  },
  {
    id: "2",
    title: "Build UI for Dashboard Notifier with Playwright and Twilio integration",
    description: "Develop a notification system for the dashboard using Playwright for browser automation and Twilio for SMS alerts.",
    status: "in_progress",
    priority: "medium",
    department: "Frontend",
    department_display_name: "Frontend",
    assigned_developers: "Bryan Libad-Libad",
    milestones: [
      {
        id: "m4",
        title: "Design Notification System",
        description: "Create design and architecture for the notification system.",
        status: "completed",
        completion_percentage: 100,
        order_index: 0,
        updates: []
      },
      {
        id: "m5",
        title: "Implement Playwright Automation",
        description: "Set up Playwright for automated browser interactions.",
        status: "in_progress",
        completion_percentage: 60,
        order_index: 1,
        updates: [
          {
            id: "u2",
            update_type: "status_update",
            content: "Implemented the core Playwright functionality. Working on error handling.",
            created_at: new Date().toISOString(),
            developer_id: "dev2",
            developer_name: "Bryan Libad-Libad"
          }
        ]
      }
    ],
    total_milestones: 2,
    milestones_completed: 1,
    milestone_progress: 80
  },
  {
    id: "3",
    title: "Sync PostgreSQL to Monday.com with NextJS for Project and Sales Data",
    description: "Create a synchronization system between PostgreSQL database and Monday.com using NextJS framework.",
    status: "completed",
    priority: "medium", 
    department: "Backend",
    department_display_name: "Backend",
    assigned_developers: "Ryan Canseco",
    milestones: [],
    total_milestones: 0,
    milestones_completed: 0,
    milestone_progress: 0
  },
  {
    id: "4",
    title: "Storm Monitoring System",
    description: "Develop a system for monitoring weather conditions and potential storms.",
    status: "assigned",
    priority: "medium",
    department: "Backend",
    department_display_name: "Backend",
    assigned_developers: "Junniel Rome Ardepuela",
    milestones: [],
    total_milestones: 0,
    milestones_completed: 0,
    milestone_progress: 0
  },
  {
    id: "5",
    title: "Deploy Dev Portal Repository to Vercel",
    description: "Deploy the developer portal codebase to Vercel for staging and testing.",
    status: "in_progress",
    priority: "medium",
    department: "DevOps",
    department_display_name: "DevOps",
    assigned_developers: "Mark Lester Perez",
    milestones: [],
    total_milestones: 0,
    milestones_completed: 0,
    milestone_progress: 0
  },
  {
    id: "6",
    title: "Streamline subcontractor invoice submission via JobForum-Zapier-Monday integration",
    description: "Create an automated pipeline for subcontractor invoice submissions using JobForum, Zapier, and Monday.com integration.",
    status: "assigned",
    priority: "medium",
    department: "Accounting",
    department_display_name: "Accounting",
    assigned_developers: "Timotius Albert, Ryan Canseco",
    milestones: [],
    total_milestones: 0,
    milestones_completed: 0,
    milestone_progress: 0
  }
];

export async function GET() {
  try {
    console.log('Using mock data for assigned tasks (to avoid database errors)');
    
    // Filter out completed tasks
    const nonCompletedTasks = mockTasks.filter(task => task.status !== 'completed');
    
    console.log(`Returning ${nonCompletedTasks.length} non-completed mock tasks`);
    
    return NextResponse.json(nonCompletedTasks);
  } 
  catch (error) {
    console.error('Failed to fetch mock assigned tasks:', error);
    return NextResponse.json({ 
      error: 'Error fetching assigned tasks',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 