import { NextResponse } from "next/server";
import { getMainDbPool, getModuleDbPool } from '@/lib/db-pool';

// Mark this route as dynamic to prevent prerendering during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Use centralized pool management - now both use the same database
const mainPool = getMainDbPool();
const modulePool = getMainDbPool(); // Use same pool since both databases are now the same

// Define types for department data
interface DepartmentData {
  active_tasks: number;
  completed_tasks: number;
  completion_rate: number;
}

// Define type for departments object
interface Departments {
  [key: string]: DepartmentData;
}

export async function GET() {
  let mainClient = null;
  
  try {
    console.log("Fetching optimized dashboard statistics from both databases...");
    
    // Get single client since both databases are the same now
    mainClient = await mainPool.connect();
    
    console.log('✅ Database connection established');

    // Execute all queries with individual error handling
    const [
      activeTasksResult,
      modulesResult,
      legacyUpdatesResult,
      moduleUpdatesResult,
      dailyComponentsResult,
      activityResult
    ] = await Promise.allSettled([
      // Active tasks from main database
      mainClient.query(`
        SELECT COUNT(DISTINCT t.id) as active_tasks 
        FROM tasks t
        JOIN task_assignments ta ON t.id::text = ta.task_id
        WHERE t.status != 'completed'
      `),

      // Total modules from same database
      mainClient.query(`
        SELECT COUNT(*) as total_modules 
        FROM task_modules
      `),

      // Legacy updates today from main database
      mainClient.query(`
        SELECT COUNT(*) as legacy_updates 
        FROM milestone_updates 
        WHERE DATE(created_at) = CURRENT_DATE
      `),

      // Module updates today from same database
      mainClient.query(`
        SELECT COUNT(*) as module_updates 
        FROM module_updates 
        WHERE DATE(created_at) = CURRENT_DATE
      `),

      // Daily components from same database
      mainClient.query(`
        SELECT COUNT(*) as daily_components 
        FROM task_modules 
        WHERE DATE(created_at) = CURRENT_DATE
      `),

      // Recent activity from main database
      mainClient.query(`
        SELECT 
          'task_assigned' as activity_type,
          t.title as task_title,
          d.name as developer_name,
          t.created_at as timestamp
        FROM task_assignments ta
        JOIN tasks t ON ta.task_id = t.id::text
        JOIN developers d ON ta.developer_id = d.id
        ORDER BY t.created_at DESC
        LIMIT 5
      `)
    ]);

    // Extract results with fallbacks and detailed error logging
    const activeTasks = activeTasksResult.status === 'fulfilled' 
      ? parseInt(activeTasksResult.value.rows[0]?.active_tasks) || 0 
      : (console.error('Active tasks query failed:', activeTasksResult.reason), 0);

    const totalModules = modulesResult.status === 'fulfilled' 
      ? parseInt(modulesResult.value.rows[0]?.total_modules) || 0 
      : (console.error('Total modules query failed:', modulesResult.reason), 0);

    const legacyUpdates = legacyUpdatesResult.status === 'fulfilled' 
      ? parseInt(legacyUpdatesResult.value.rows[0]?.legacy_updates) || 0 
      : (console.error('Legacy updates query failed:', legacyUpdatesResult.reason), 0);

    const moduleUpdates = moduleUpdatesResult.status === 'fulfilled' 
      ? parseInt(moduleUpdatesResult.value.rows[0]?.module_updates) || 0 
      : (console.error('Module updates query failed:', moduleUpdatesResult.reason), 0);

    const dailyComponents = dailyComponentsResult.status === 'fulfilled' 
      ? parseInt(dailyComponentsResult.value.rows[0]?.daily_components) || 0 
      : (console.error('Daily components query failed:', dailyComponentsResult.reason), 0);

    const recentActivity = activityResult.status === 'fulfilled' 
      ? activityResult.value.rows || [] 
      : (console.error('Recent activity query failed:', activityResult.reason), []);

    const totalDailyUpdates = legacyUpdates + moduleUpdates;

    console.log("Successfully processed dashboard statistics:");
    console.log(`  Active tasks: ${activeTasks}`);
    console.log(`  Total modules: ${totalModules}`);
    console.log(`  Daily updates: ${totalDailyUpdates} (${legacyUpdates} legacy + ${moduleUpdates} module)`);
    console.log(`  Daily components: ${dailyComponents}`);
    
    // Prepare the response with the new optimized metrics
    const response = {
      activeTasks,
      totalModules,
      dailyUpdates: totalDailyUpdates,
      dailyComponents,
      recent_activity: recentActivity
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    );
  } finally {
    // Only release the client once since both databases are the same
    if (mainClient) {
      mainClient.release();
    }
  }
} 
