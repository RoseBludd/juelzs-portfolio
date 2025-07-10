import { NextResponse } from 'next/server';
import DatabaseService from '@/services/database.service';

export async function GET() {
  try {
    const databaseService = DatabaseService.getInstance();
    
    // Initialize database connection
    try {
      await databaseService.initialize();
    } catch {
      console.warn('Database initialization failed, using fallback data');
    }

    // Fetch data
    const [modules, stats] = await Promise.all([
      databaseService.getModules(),
      databaseService.getRegistryStats()
    ]);

    const connectionStatus = databaseService.getConnectionStatus();

    return NextResponse.json({
      success: true,
      data: {
        modules,
        stats,
        connectionStatus
      }
    });
  } catch (error) {
    console.error('Registry API error:', error);
    
    // Return fallback data from database service
    const fallbackService = DatabaseService.getInstance();
    const fallbackModules = await fallbackService.getModules();
    const fallbackStats = await fallbackService.getRegistryStats();
    
    return NextResponse.json({
      success: false,
      data: {
        modules: fallbackModules,
        stats: fallbackStats,
        connectionStatus: {
          connected: false,
          poolSize: 1,
          environment: 'development'
        }
      }
    });
  }
} 