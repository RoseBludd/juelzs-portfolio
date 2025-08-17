import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const mainDb = getMainDbPool();

    // Get active developers
    const developersQuery = `
      SELECT id, name, email 
      FROM developers 
      WHERE status = 'active' 
      ORDER BY name
    `;
    const developersResult = await mainDb.query(developersQuery);
    const developers = developersResult.rows;

    const detailedData: {
      developers: any[]
    } = {
      developers: []
    };

    for (const developer of developers) {
      const developerData: {
        id: any;
        name: any;
        email: any;
        dateGroups: any[];
      } = {
        id: developer.id,
        name: developer.name,
        email: developer.email,
        dateGroups: []
      };

      // Get data for each date in the range
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        const currentDate = d.toISOString().split('T')[0];
        
        // Get modules for this date
        const modulesQuery = `
          SELECT 
            tm.id,
            tm.name,
            tm.url,
            tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' as created_at,
            mt.name as type
          FROM task_modules tm
          LEFT JOIN module_types mt ON tm.module_type_id = mt.id
          WHERE tm.created_by = $1::uuid
          AND DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
          ORDER BY tm.created_at DESC
        `;
        const modulesResult = await mainDb.query(modulesQuery, [developer.id, currentDate]);
        
        // Get loom videos for this date (from multiple sources)
        const loomsQuery = `
          -- From task modules URL field
          SELECT 
            'Module URL' as source,
            tm.name as title,
            tm.url,
            tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' as created_at
          FROM task_modules tm
          WHERE tm.created_by = $1::uuid
          AND DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
          AND tm.url LIKE '%loom.com%'
          
          UNION ALL
          
          -- From module updates
          SELECT 
            'Module Update' as source,
            'Loom Video' as title,
            mu.content as url,
            mu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' as created_at
          FROM module_updates mu
          WHERE mu.developer_id = $1::uuid
          AND DATE(mu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
          AND mu.content LIKE '%loom.com%'
          
          UNION ALL
          
          -- From milestone updates
          SELECT 
            'Milestone Update' as source,
            'Loom Video' as title,
            msu.content as url,
            msu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' as created_at
          FROM milestone_updates msu
          WHERE msu.developer_id = $1::uuid
          AND DATE(msu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
          AND msu.content LIKE '%loom.com%'
          
          ORDER BY created_at DESC
        `;
        const loomsResult = await mainDb.query(loomsQuery, [developer.id, currentDate]);
        
        // Get scribes for this date (ScribeHow.com documentation)
        const scribesQuery = `
          SELECT 
            'ScribeHow Documentation' as source,
            ms.title,
            ms.scribe_url as url,
            ms.description as preview,
            ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' as created_at
          FROM module_scribes ms
          LEFT JOIN task_modules tm ON ms.module_id = tm.id
          WHERE tm.created_by = $1::uuid
          AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
          ORDER BY ms.created_at DESC
        `;

        // Get cursor chats for this date (separate from scribes)
        const cursorChatsQuery = `
          -- From cursor chats
          SELECT 
            'Cursor Chat' as source,
            COALESCE(cc.title, cc.filename) as title,
            '' as url,
            LEFT(cc.content, 100) as preview,
            cc.upload_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' as created_at
          FROM cursor_chats cc
          WHERE cc.developer_id = $1::uuid
          AND DATE(cc.upload_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
          
          UNION ALL
          
          -- From module submissions (cursor chat type)
          SELECT 
            'Module Submission' as source,
            'Cursor Chat Submission' as title,
            '' as url,
            LEFT(ms.content, 100) as preview,
            ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' as created_at
          FROM module_submissions ms
          WHERE ms.developer_id = $1::uuid
          AND ms.submission_type = 'cursor_chat'
          AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
          
          ORDER BY created_at DESC
        `;
        const scribesResult = await mainDb.query(scribesQuery, [developer.id, currentDate]);
        const cursorChatsResult = await mainDb.query(cursorChatsQuery, [developer.id, currentDate]);

        // Only include dates that have data
        const modules = modulesResult.rows.map(row => ({
          name: row.name,
          type: row.type || 'Unknown',
          url: row.url,
          created_at: row.created_at?.toLocaleString('en-US', { 
            timeZone: 'America/Chicago',
            hour12: true,
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
        }));

        const looms = loomsResult.rows.map(row => ({
          title: row.title,
          source: row.source,
          url: row.url,
          created_at: row.created_at?.toLocaleString('en-US', { 
            timeZone: 'America/Chicago',
            hour12: true,
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
        }));

        const scribes = scribesResult.rows.map(row => ({
          title: row.title || 'Untitled',
          source: row.source,
          url: row.url,
          preview: row.preview,
          created_at: row.created_at?.toLocaleString('en-US', { 
            timeZone: 'America/Chicago',
            hour12: true,
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
        }));

        const cursorChats = cursorChatsResult.rows.map(row => ({
          title: row.title || 'Untitled',
          source: row.source,
          preview: row.preview,
          created_at: row.created_at?.toLocaleString('en-US', { 
            timeZone: 'America/Chicago',
            hour12: true,
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
        }));

        const totalItems = modules.length + looms.length + scribes.length + cursorChats.length;
        
        if (totalItems > 0) {
          developerData.dateGroups.push({
            date: new Date(currentDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            totalItems,
            modules,
            looms,
            scribes,
            cursorChats
          });
        }
      }

      if (developerData.dateGroups.length > 0) {
        detailedData.developers.push(developerData);
      }
    }

    return NextResponse.json(detailedData);
    
  } catch (error) {
    console.error('Error in detailed debug data API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detailed debug data' },
      { status: 500 }
    );
  }
} 