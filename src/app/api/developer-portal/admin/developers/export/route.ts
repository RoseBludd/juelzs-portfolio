import { NextRequest, NextResponse } from 'next/server';

// For now, use the same mock data as the main developers endpoint
const mockDevelopers = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    role: "frontend_specialist",
    status: "active",
    current_work_status: "working",
    active_tasks: 2,
    completed_tasks: 15,
    average_score: 4.7,
    total_earned: 2500,
    performance_metrics: {
      task_completion_rate: 85,
      avg_response_time_hours: 2.5,
      on_time_delivery_rate: 92,
      code_quality_score: 4.6,
      communication_score: 4.8,
      reliability_score: 4.5
    },
    availability: {
      hours_per_week: 40,
      timezone: "PST",
      preferred_communication: "slack"
    },
    created_at: "2024-01-15T08:00:00Z",
    last_activity: "2024-01-20T16:30:00Z"
  },
  {
    id: "2", 
    name: "Marcus Johnson",
    email: "marcus.johnson@example.com",
    role: "backend_specialist",
    status: "active",
    current_work_status: "working",
    active_tasks: 3,
    completed_tasks: 22,
    average_score: 4.9,
    total_earned: 3200,
    performance_metrics: {
      task_completion_rate: 95,
      avg_response_time_hours: 1.8,
      on_time_delivery_rate: 96,
      code_quality_score: 4.9,
      communication_score: 4.7,
      reliability_score: 4.8
    },
    availability: {
      hours_per_week: 45,
      timezone: "EST",
      preferred_communication: "email"
    },
    created_at: "2024-01-10T09:00:00Z",
    last_activity: "2024-01-20T15:45:00Z"
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    email: "elena.rodriguez@example.com", 
    role: "integration_specialist",
    status: "active",
    current_work_status: "available",
    active_tasks: 1,
    completed_tasks: 18,
    average_score: 4.6,
    total_earned: 2800,
    performance_metrics: {
      task_completion_rate: 89,
      avg_response_time_hours: 3.2,
      on_time_delivery_rate: 88,
      code_quality_score: 4.5,
      communication_score: 4.6,
      reliability_score: 4.7
    },
    availability: {
      hours_per_week: 35,
      timezone: "CST", 
      preferred_communication: "slack"
    },
    created_at: "2024-01-08T10:00:00Z",
    last_activity: "2024-01-20T17:15:00Z"
  },
  {
    id: "4",
    name: "David Kim",
    email: "david.kim@example.com",
    role: "frontend_specialist",
    status: "active",
    current_work_status: "available",
    active_tasks: 0,
    completed_tasks: 8,
    average_score: 4.3,
    total_earned: 1200,
    performance_metrics: {
      task_completion_rate: 78,
      avg_response_time_hours: 4.1,
      on_time_delivery_rate: 82,
      code_quality_score: 4.2,
      communication_score: 4.4,
      reliability_score: 4.1
    },
    availability: {
      hours_per_week: 30,
      timezone: "PST",
      preferred_communication: "slack"
    },
    created_at: "2024-01-12T11:00:00Z",
    last_activity: "2024-01-19T14:20:00Z"
  },
  {
    id: "5",
    name: "Aisha Patel",
    email: "aisha.patel@example.com",
    role: "backend_specialist", 
    status: "active",
    current_work_status: "working", 
    active_tasks: 2,
    completed_tasks: 25,
    average_score: 4.8,
    total_earned: 3800,
    performance_metrics: {
      task_completion_rate: 93,
      avg_response_time_hours: 2.1,
      on_time_delivery_rate: 94,
      code_quality_score: 4.8,
      communication_score: 4.9,
      reliability_score: 4.7
    },
    availability: {
      hours_per_week: 40,
      timezone: "EST",
      preferred_communication: "email"
    },
    created_at: "2024-01-05T12:00:00Z",
    last_activity: "2024-01-20T18:00:00Z"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv, json
    const includeMetrics = searchParams.get('includeMetrics') === 'true';
    const includeAvailability = searchParams.get('includeAvailability') === 'true';
    
    console.log(`🔄 Exporting developers data in ${format} format`);

    // Apply any filters (same as main endpoint)
    const status = searchParams.get('status') || 'all';
    const role = searchParams.get('role') || 'all';
    const workStatus = searchParams.get('workStatus') || 'all';

    let filteredDevelopers = mockDevelopers.filter(dev => {
      if (status !== 'all' && dev.status !== status) return false;
      if (role !== 'all' && dev.role !== role) return false;
      if (workStatus !== 'all' && dev.current_work_status !== workStatus) return false;
      return true;
    });

    if (format === 'json') {
      // Return JSON format
      const jsonData = {
        export_date: new Date().toISOString(),
        total_developers: filteredDevelopers.length,
        filters: { status, role, workStatus },
        developers: filteredDevelopers.map(dev => ({
          id: dev.id,
          name: dev.name,
          email: dev.email,
          role: dev.role.replace('_', ' '),
          status: dev.status,
          work_status: dev.current_work_status,
          active_tasks: dev.active_tasks,
          completed_tasks: dev.completed_tasks,
          average_score: dev.average_score,
          total_earned: dev.total_earned,
          created_at: dev.created_at,
          last_activity: dev.last_activity,
          ...(includeMetrics && {
            performance_metrics: dev.performance_metrics
          }),
          ...(includeAvailability && {
            availability: dev.availability
          })
        }))
      };

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="developers-export-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

    // CSV format
    const headers = [
      'ID',
      'Name', 
      'Email',
      'Role',
      'Status',
      'Work Status',
      'Active Tasks',
      'Completed Tasks',
      'Average Score',
      'Total Earned',
      'Created Date',
      'Last Activity'
    ];

    if (includeMetrics) {
      headers.push(
        'Task Completion Rate (%)',
        'Avg Response Time (hrs)',
        'On Time Delivery Rate (%)',
        'Code Quality Score',
        'Communication Score',
        'Reliability Score'
      );
    }

    if (includeAvailability) {
      headers.push(
        'Hours Per Week',
        'Timezone',
        'Preferred Communication'
      );
    }

    const csvRows = [headers.join(',')];

    filteredDevelopers.forEach(dev => {
      const row = [
        dev.id,
        `"${dev.name}"`,
        dev.email,
        `"${dev.role.replace('_', ' ')}"`,
        dev.status,
        dev.current_work_status,
        dev.active_tasks,
        dev.completed_tasks,
        dev.average_score || '',
        dev.total_earned,
        new Date(dev.created_at).toLocaleDateString(),
        new Date(dev.last_activity).toLocaleDateString()
      ];

      if (includeMetrics) {
        row.push(
          dev.performance_metrics.task_completion_rate.toString(),
          dev.performance_metrics.avg_response_time_hours.toString(),
          dev.performance_metrics.on_time_delivery_rate.toString(),
          dev.performance_metrics.code_quality_score.toString(),
          dev.performance_metrics.communication_score.toString(),
          (dev.performance_metrics.reliability_score || '').toString()
        );
      }

      if (includeAvailability) {
        row.push(
          dev.availability.hours_per_week.toString(),
          dev.availability.timezone,
          dev.availability.preferred_communication
        );
      }

      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="developers-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json(
      { error: 'Failed to export developer data' },
      { status: 500 }
    );
  }
} 