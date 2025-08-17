import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

// Use singleton database connection
const pool = getMainDbPool();

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { updateId, comment, adminId, adminName } = body;
    
    // Validation
    if (!updateId || !comment) {
      return NextResponse.json({ 
        error: 'Bad Request', 
        message: 'Update ID and comment are required'
      }, { status: 400 });
    }
    
    console.log(`Adding admin comment to update ${updateId}`);
    
    // Check both legacy milestone updates and module updates tables
    const [legacyCheck, moduleCheck] = await Promise.allSettled([
      pool.query('SELECT id FROM milestone_updates WHERE id = $1', [updateId]),
      pool.query('SELECT id FROM module_updates WHERE id = $1', [updateId])
    ]);
    
    const isLegacyUpdate = legacyCheck.status === 'fulfilled' && legacyCheck.value.rows.length > 0;
    const isModuleUpdate = moduleCheck.status === 'fulfilled' && moduleCheck.value.rows.length > 0;
    
    if (!isLegacyUpdate && !isModuleUpdate) {
      return NextResponse.json({ 
        error: 'Not Found', 
        message: 'Update not found in either milestone_updates or module_updates'
      }, { status: 404 });
    }
    
    // Add admin response to the appropriate table
    const timestamp = new Date().toISOString();
    let result = null;
    
    if (isLegacyUpdate) {
      console.log(`Adding comment to legacy milestone update ${updateId}`);
      result = await pool.query(
      `UPDATE milestone_updates 
         SET admin_response = $1, admin_id = $2, admin_name = $3, admin_response_at = $4
         WHERE id = $5
         RETURNING id`,
        [comment, adminId || 'admin', adminName || 'Admin', timestamp, updateId]
      );
    } else if (isModuleUpdate) {
      console.log(`Adding comment to module update ${updateId}`);
      // For module updates, we need to check if admin response columns exist
      try {
        result = await pool.query(
          `UPDATE module_updates 
           SET admin_response = $1, admin_id = $2, admin_name = $3, admin_response_at = $4
           WHERE id = $5
           RETURNING id`,
          [comment, adminId || 'admin', adminName || 'Admin', timestamp, updateId]
        );
      } catch (columnError) {
        // If admin columns don't exist in module_updates, add them
        console.log('Admin columns may not exist in module_updates, trying to add them...');
        await pool.query(`
          ALTER TABLE module_updates 
          ADD COLUMN IF NOT EXISTS admin_response TEXT,
          ADD COLUMN IF NOT EXISTS admin_id TEXT,
          ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS admin_response_at TIMESTAMP
        `);
        
        // Retry the update
        result = await pool.query(
          `UPDATE module_updates 
           SET admin_response = $1, admin_id = $2, admin_name = $3, admin_response_at = $4
       WHERE id = $5
       RETURNING id`,
      [comment, adminId || 'admin', adminName || 'Admin', timestamp, updateId]
    );
      }
    }
    
    if (!result || result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Update Failed', 
        message: 'Failed to update update record'
      }, { status: 500 });
    }
    
    // Create a notification for the developer (optional - don't fail if this doesn't work)
    try {
      const notificationResult = await pool.query(
        `INSERT INTO notifications 
         (milestone_update_id, type, message, created_at, to_developer_id, from_admin_id, from_admin_name)
         SELECT $1, 'admin_response', $2, $3, developer_id, $4, $5
         FROM milestone_updates 
         WHERE id = $1`,
        [updateId, comment, timestamp, adminId || 'admin', adminName || 'Admin']
      );
      console.log('Notification created successfully');
    } catch (notifError) {
      // Log notification error but don't fail the whole request
      console.error('Failed to create notification (continuing anyway):', notifError);
    }
    
    console.log(`Admin comment added successfully to update ${updateId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Comment added successfully',
      timestamp
    });
    
  } catch (error) {
    console.error('Failed to add admin comment:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 