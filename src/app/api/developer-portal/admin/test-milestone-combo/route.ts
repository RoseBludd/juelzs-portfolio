import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool, getModuleDbPool } from '@/lib/db-pool';

const mainPool = getMainDbPool();
const modulePool = getModuleDbPool();

export async function GET(request: NextRequest) {
  try {
    // Security check
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('key');
    
    if (process.env.NODE_ENV === 'production' && adminKey !== 'test-combo-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🧪 Testing milestone combo query...');
    
    // Test each query separately
    const [mainClient, moduleClient] = await Promise.allSettled([
      mainPool.connect(),
      modulePool.connect()
    ]).then(results => [
      results[0].status === 'fulfilled' ? results[0].value : null,
      results[1].status === 'fulfilled' ? results[1].value : null
    ]);
    
    console.log('Connections:', { mainClient: !!mainClient, moduleClient: !!moduleClient });
    
    // Test legacy query
    let legacyResult = null;
    let legacyError = null;
    if (mainClient) {
      try {
        legacyResult = await mainClient.query(`
          SELECT 
            mu.id, mu.update_type, mu.content, mu.created_at,
            d.name as developer_name, 'legacy' as source_type
          FROM milestone_updates mu
          LEFT JOIN developers d ON mu.developer_id = d.id
          ORDER BY mu.created_at DESC
          LIMIT 3
        `);
        console.log(`Legacy query success: ${legacyResult.rows.length} rows`);
      } catch (error) {
        legacyError = error;
        console.error('Legacy query error:', error);
      }
    }
    
    // Test module query
    let moduleResult = null;
    let moduleError = null;
    if (moduleClient) {
      try {
        moduleResult = await moduleClient.query(`
          SELECT 
            mu.id, mu.update_type, COALESCE(mu.title, mu.content) as content, mu.created_at,
            d.name as developer_name, 'module' as source_type,
            tm.name as module_name
          FROM module_updates mu
          JOIN task_modules tm ON mu.module_id = tm.id
          LEFT JOIN developers d ON mu.developer_id = d.id
          ORDER BY mu.created_at DESC
          LIMIT 3
        `);
        console.log(`Module query success: ${moduleResult.rows.length} rows`);
      } catch (error) {
        moduleError = error;
        console.error('Module query error:', error);
      }
    }
    
    // Release connections
    if (mainClient) mainClient.release();
    if (moduleClient) moduleClient.release();
    
    return NextResponse.json({
      success: true,
      debug: {
        connections: {
          mainClient: !!mainClient,
          moduleClient: !!moduleClient
        },
        legacyQuery: {
          success: !!legacyResult,
          error: legacyError ? (legacyError instanceof Error ? legacyError.message : String(legacyError)) : null,
          count: legacyResult ? legacyResult.rows.length : 0,
          sample: legacyResult ? legacyResult.rows.slice(0, 2) : []
        },
        moduleQuery: {
          success: !!moduleResult,
          error: moduleError ? (moduleError instanceof Error ? moduleError.message : String(moduleError)) : null,
          count: moduleResult ? moduleResult.rows.length : 0,
          sample: moduleResult ? moduleResult.rows.slice(0, 2) : []
        },
        combinedCount: (legacyResult?.rows.length || 0) + (moduleResult?.rows.length || 0)
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error testing milestone combo:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test milestone combo',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 