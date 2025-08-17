import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Use centralized main database pool
const pool = getMainDbPool();

// Relationship calculation function matching the developer view logic
function calculateModuleRelationships(currentModule: any, allModules: any[]) {
  const related: any[] = [];
  const dependencies: any[] = [];
  const dependents: any[] = [];
  const currentModuleNameLower = currentModule.name.toLowerCase();
  
  allModules.forEach(otherModule => {
    if (otherModule.id === currentModule.id) return;
    
    const otherNameLower = otherModule.name.toLowerCase();
    
    // 1. Testing relationships
    if (['ui_components', 'functions', 'api_endpoints'].includes(currentModule.module_type)) {
      if (otherModule.module_type === 'tests' && 
          (otherNameLower.includes(currentModuleNameLower.split(' ')[0]) || 
           (otherNameLower.includes('test') && 
            currentModule.tags?.some((tag: string) => otherModule.tags?.includes(tag))))) {
        dependencies.push(otherModule);
        related.push(otherModule);
      }
    }
    
    // 2. Component family relationships
    if (currentModule.module_type === 'ui_components' && otherModule.module_type === 'ui_components') {
      if ((currentModuleNameLower.includes('chat') && otherNameLower.includes('chat')) ||
          (currentModuleNameLower.includes('message') && otherNameLower.includes('message')) ||
          (currentModuleNameLower.includes('user') && otherNameLower.includes('user'))) {
        related.push(otherModule);
      }
    }
    
    // 3. Function dependencies
    if (currentModule.module_type === 'ui_components' && otherModule.module_type === 'functions') {
      if (currentModule.tags?.some((tag: string) => otherModule.tags?.includes(tag)) ||
          (currentModuleNameLower.includes('message') && otherNameLower.includes('message')) ||
          (currentModuleNameLower.includes('chat') && otherNameLower.includes('notification'))) {
        dependencies.push(otherModule);
        related.push(otherModule);
      }
    }
    
    // 4. API-Component relationships
    if (currentModule.module_type === 'ui_components' && otherModule.module_type === 'api_endpoints') {
      if (currentModule.tags?.some((tag: string) => otherModule.tags?.includes(tag)) ||
          (currentModuleNameLower.includes('message') && otherNameLower.includes('message')) ||
          (currentModuleNameLower.includes('chat') && otherNameLower.includes('websocket'))) {
        dependencies.push(otherModule);
        related.push(otherModule);
      }
    }
    
    // 5. Tag-based relationships
    const sharedTags = currentModule.tags?.filter((tag: string) => otherModule.tags?.includes(tag)) || [];
    if (sharedTags.length >= 2 && !related.find(r => r.id === otherModule.id)) {
      related.push(otherModule);
    }
    
    // 6. Video demonstration relationships
    if (otherNameLower.includes('video') || otherNameLower.includes('demo') || 
        otherNameLower.includes('loom') || otherNameLower.includes('recording') ||
        otherModule.tags?.some((tag: string) => ['video', 'demo', 'loom', 'recording', 'walkthrough'].includes(tag.toLowerCase()))) {
      if (currentModuleNameLower.split(' ').some((word: string) => 
          word.length > 3 && otherNameLower.includes(word)) ||
          currentModule.tags?.some((tag: string) => otherModule.tags?.includes(tag))) {
        related.push(otherModule);
      }
    }
    
    // Reverse dependencies - modules that depend on this one
    if (otherModule.module_type === 'ui_components' && currentModule.module_type === 'functions') {
      if (otherModule.tags?.some((tag: string) => currentModule.tags?.includes(tag)) ||
          (otherNameLower.includes('message') && currentModuleNameLower.includes('message')) ||
          (otherNameLower.includes('chat') && currentModuleNameLower.includes('notification'))) {
        dependents.push(otherModule);
        if (!related.find(r => r.id === otherModule.id)) {
          related.push(otherModule);
        }
      }
    }
  });
  
  return {
    dependencies: dependencies.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
    dependents: dependents.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
    all: related.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
  };
}

// GET - Get comprehensive registry data for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'overview';
    const search = searchParams.get('search');
    const moduleType = searchParams.get('moduleType');
    const status = searchParams.get('status');
    const taskId = searchParams.get('taskId');
    const tags = searchParams.get('tags');

    const registryData: any = {};

    if (view === 'overview') {
      // Overview stats using the same table structure as developer interface
      const statsResult = await pool.query(`
        SELECT 
          COUNT(DISTINCT mt.name) as total_module_types,
          COUNT(*) as total_modules,
          COUNT(*) FILTER (WHERE tm.status = 'completed') as completed_modules,
          COUNT(*) FILTER (WHERE tm.status = 'in_progress') as in_progress_modules,
          COUNT(*) FILTER (WHERE tm.status = 'pending') as pending_modules,
          COUNT(DISTINCT tm.task_id) as total_tasks_with_modules,
          COALESCE(AVG(tm.completion_percentage), 0) as avg_completion
        FROM task_modules tm
        JOIN module_types mt ON tm.module_type_id = mt.id
      `);
      
      // Handle dependencies count gracefully
      let dependenciesCount = 0;
      try {
        const dependenciesResult = await pool.query(`
          SELECT COUNT(*) as total_dependencies FROM module_dependencies
        `);
        dependenciesCount = parseInt(dependenciesResult.rows[0].total_dependencies) || 0;
      } catch (error) {
        console.log('Module dependencies table not found, using 0 for dependencies count');
      }

      registryData.overview = {
        ...statsResult.rows[0],
        total_dependencies: dependenciesCount
      };

      // Get recent activity
      try {
        const activityResult = await pool.query(`
          SELECT 
            mu.content,
            mu.created_at,
            d.name as developer_name
          FROM module_updates mu
          LEFT JOIN developers d ON mu.developer_id = d.id
          ORDER BY mu.created_at DESC
          LIMIT 10
        `);
        
        registryData.recentActivity = activityResult.rows;
      } catch (error) {
        console.log('Module updates table not found, using empty array for recent activity');
        registryData.recentActivity = [];
      }
    }

    if (view === 'module-types' || view === 'overview') {
      // Get module types with counts (same as developer interface)
      const moduleTypesResult = await pool.query(`
        SELECT 
          mt.id,
          mt.name,
          mt.description,
          mt.icon,
          mt.color,
          mt.sort_order,
          mt.is_active,
          mt.created_at as module_type_created_at,
          COUNT(tm.id) as module_count
        FROM module_types mt
        LEFT JOIN task_modules tm ON mt.id = tm.module_type_id
        WHERE mt.is_active = true
        GROUP BY mt.id, mt.name, mt.description, mt.icon, mt.color, mt.sort_order, mt.is_active, mt.created_at
        ORDER BY mt.sort_order, mt.name
      `);
      
      registryData.moduleTypes = moduleTypesResult.rows;
    }

    if (view === 'modules' || view === 'all') {
      // Build query with filters (same structure as developer modules API)
      let query = `
        SELECT 
          tm.id,
          tm.name,
          tm.description,
          tm.file_path,
          tm.url,
          tm.status,
          tm.completion_percentage,
          tm.sort_order,
          tm.tags,
          tm.metadata,
          tm.created_at,
          tm.updated_at,
          tm.task_id,
          mt.name as module_type,
          mt.icon as module_icon,
          mt.color as module_color,
          mt.description as module_type_description,
          (SELECT COUNT(*) FROM module_dependencies WHERE module_id = tm.id) as dependency_count,
          (SELECT COUNT(*) FROM module_submissions WHERE module_id = tm.id) as submission_count,
          (SELECT COUNT(*) FROM module_updates WHERE module_id = tm.id) as update_count
        FROM task_modules tm
        JOIN module_types mt ON tm.module_type_id = mt.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 0;

      if (moduleType && moduleType !== 'all') {
        paramCount++;
        query += ` AND mt.name = $${paramCount}`;
        params.push(moduleType);
      }

      if (status && status !== 'all') {
        paramCount++;
        query += ` AND tm.status = $${paramCount}`;
        params.push(status);
      }

      if (search) {
        paramCount++;
        query += ` AND (tm.name ILIKE $${paramCount} OR tm.description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (tags && tags !== 'all') {
        paramCount++;
        query += ` AND $${paramCount} = ANY(tm.tags)`;
        params.push(tags);
      }

      if (taskId && taskId !== 'all') {
        paramCount++;
        query += ` AND tm.task_id = $${paramCount}::uuid`;
        params.push(taskId);
      }

      query += ` ORDER BY mt.sort_order, tm.sort_order, tm.name`;

      const modulesResult = await pool.query(query, params);
      const allModules = modulesResult.rows;

      // Calculate dynamic relationships for each module
      const modulesWithRelationships = allModules.map(module => {
        const relationships = calculateModuleRelationships(module, allModules);
        return {
          ...module,
          dependency_count: relationships.dependencies.length,
          dependent_count: relationships.dependents.length,
          total_relationships: relationships.all.length
        };
      });

      registryData.modules = modulesWithRelationships;
    }

    if (view === 'tasks' || view === 'overview') {
      // Get tasks with module information
      const tasksResult = await pool.query(`
        SELECT 
          tm.task_id,
          COUNT(*) as total_modules,
          COUNT(*) FILTER (WHERE tm.status = 'completed') as completed_modules,
          COUNT(*) FILTER (WHERE tm.status = 'in_progress') as in_progress_modules,
          COUNT(*) FILTER (WHERE tm.status = 'pending') as pending_modules,
          AVG(tm.completion_percentage) as avg_completion,
          MIN(tm.created_at) as first_module_created,
          MAX(tm.updated_at) as last_module_updated,
          array_agg(DISTINCT mt.name) as module_types_used
        FROM task_modules tm
        JOIN module_types mt ON tm.module_type_id = mt.id
        GROUP BY tm.task_id
        HAVING COUNT(*) > 0
        ORDER BY last_module_updated DESC
      `);
      
      registryData.tasks = tasksResult.rows;
    }

    if (view === 'dependencies') {
      // Get formal module dependencies (handle gracefully if table doesn't exist)
      try {
        const dependenciesResult = await pool.query(`
          SELECT 
            md.id,
            tm1.name as module_name,
            tm2.name as dependency_name,
            mt1.name as module_type,
            mt2.name as dependency_type,
            md.created_at
          FROM module_dependencies md
          JOIN task_modules tm1 ON md.module_id = tm1.id
          JOIN module_types mt1 ON tm1.module_type_id = mt1.id
          JOIN task_modules tm2 ON md.depends_on_module_id = tm2.id
          JOIN module_types mt2 ON tm2.module_type_id = mt2.id
          ORDER BY md.created_at DESC
        `);
        
        registryData.dependencies = dependenciesResult.rows;
      } catch (error) {
        console.log('Module dependencies table not found or empty');
        registryData.dependencies = [];
      }
    }

    if (view === 'activity') {
      // Get recent module activity (handle gracefully if table doesn't exist)
      try {
        const activityResult = await pool.query(`
          SELECT 
            mu.id,
            mu.content,
            mu.update_type,
            mu.created_at,
            tm.name as module_name,
            mt.name as module_type,
            d.name as developer_name,
            d.profile_picture_url as developer_profile_picture_url
          FROM module_updates mu
          JOIN task_modules tm ON mu.module_id = tm.id
          JOIN module_types mt ON tm.module_type_id = mt.id
          LEFT JOIN developers d ON mu.developer_id = d.id
          ORDER BY mu.created_at DESC
          LIMIT 50
        `);
        
        registryData.recentActivity = activityResult.rows;
      } catch (error) {
        console.log('Module updates table not found, using empty array for recent activity');
        registryData.recentActivity = [];
      }
    }

    // Get available tags for filtering
    const tagsResult = await pool.query(`
      SELECT DISTINCT unnest(tags) as tag
      FROM task_modules
      WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
      ORDER BY tag
    `);
    
    registryData.availableTags = tagsResult.rows.map((row: any) => row.tag);

    return NextResponse.json(registryData);

  } catch (error) {
    console.error('Registry API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registry data' },
      { status: 500 }
    );
  }
} 