import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

const pool = getMainDbPool();

export async function GET(request: NextRequest) {
  try {
    // Security check
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('key');
    
    if (process.env.NODE_ENV === 'production' && adminKey !== 'debug-data-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔍 Debugging milestone data in production...');
    
    // Check legacy milestone updates
    const legacyResult = await pool.query(`
      SELECT 
        mu.id,
        mu.update_type,
        mu.content,
        mu.created_at,
        mu.developer_id,
        d.name as developer_name,
        'legacy' as source_type
      FROM milestone_updates mu
      LEFT JOIN developers d ON mu.developer_id = d.id
      ORDER BY mu.created_at DESC
      LIMIT 3
    `);
    
    // Check module updates
    const moduleResult = await pool.query(`
      SELECT 
        modu.id,
        modu.update_type,
        COALESCE(modu.title, modu.content) as content,
        modu.created_at,
        modu.developer_id,
        d.name as developer_name,
        tm.name as module_name,
        'module' as source_type
      FROM module_updates modu
      JOIN task_modules tm ON modu.module_id = tm.id
      LEFT JOIN developers d ON modu.developer_id = d.id
      ORDER BY modu.created_at DESC
      LIMIT 5
    `);
    
    // Check the exact combined query that the API should be using
    const combinedResult = await pool.query(`
      SELECT 
        mu.id,
        mu.update_type,
        mu.content,
        mu.created_at,
        mu.developer_id,
        d.name as developer_name,
        mu.admin_response,
        t.title as task_title,
        tm.title as milestone_title,
        'legacy' as source_type
      FROM milestone_updates mu
      JOIN task_milestones tm ON mu.milestone_id = tm.id
      JOIN tasks t ON tm.task_id = t.id
      LEFT JOIN developers d ON mu.developer_id = d.id
      
      UNION ALL
      
      SELECT 
        modu.id,
        modu.update_type,
        COALESCE(modu.title, modu.content) as content,
        modu.created_at,
        modu.developer_id,
        d.name as developer_name,
        NULL as admin_response,
        'Modular Task' as task_title,
        task_mod.name as milestone_title,
        'module' as source_type
      FROM module_updates modu
      JOIN task_modules task_mod ON modu.module_id = task_mod.id
      LEFT JOIN developers d ON modu.developer_id = d.id
      
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    return NextResponse.json({
      success: true,
      debug: {
        legacyUpdates: {
          count: legacyResult.rows.length,
          sample: legacyResult.rows
        },
        moduleUpdates: {
          count: moduleResult.rows.length,
          sample: moduleResult.rows
        },
        combinedQuery: {
          count: combinedResult.rows.length,
          sample: combinedResult.rows,
          legacyCount: combinedResult.rows.filter(r => r.source_type === 'legacy').length,
          moduleCount: combinedResult.rows.filter(r => r.source_type === 'module').length
        }
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error debugging milestone data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to debug milestone data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 