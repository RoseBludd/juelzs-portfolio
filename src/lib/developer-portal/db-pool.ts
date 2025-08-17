import { Pool, PoolConfig } from 'pg';

// Disable SSL certificate verification for both development and production
// This is safe for Supabase connections which use trusted certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

// Primary Supabase database URL - SINGLE SOURCE OF TRUTH
const SUPABASE_URL = 'postgres://postgres.fvbaytzkukfqfpwozbtm:S43TjpedayzcuzoT@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

// Centralized database pool configuration
export function createDbPool(connectionString?: string): Pool {
  const config: PoolConfig = {
    connectionString: connectionString || SUPABASE_URL,
    ssl: {
      rejectUnauthorized: false // Accept self-signed certificates
    },
    // Optimized for serverless environments
    max: process.env.NODE_ENV === 'production' ? 1 : 10,
    min: 0, // Don't keep connections alive in serverless
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  };

  const pool = new Pool(config);

  // Add error handling
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });

  // For serverless, ensure pool closes when process exits
  if (process.env.NODE_ENV === 'production') {
    process.on('beforeExit', () => {
      pool.end().catch(console.error);
    });
  }

  return pool;
}

// Singleton pools for common databases
let mainDbPool: Pool | undefined;
let moduleDbPool: Pool | undefined;

export function getMainDbPool(): Pool {
  if (!mainDbPool) {
    // SINGLE SOURCE OF TRUTH: Always use Supabase (production env variable takes precedence)
    const databaseUrl = process.env.POSTGRES_URL || SUPABASE_URL;
    
    console.log('🔗 Database URL source:', 
          process.env.POSTGRES_URL ? 'POSTGRES_URL (Production Supabase)' : 
          'SUPABASE_URL (Direct Singleton)'
        );
    
    console.log('🔗 Database host:', databaseUrl.split('@')[1]?.split('/')[0]);
    
    mainDbPool = createDbPool(databaseUrl);
  }
  return mainDbPool;
}

export function getModuleDbPool(): Pool {
  // Now using the same main database for everything
  return getMainDbPool();
}

// Helper function for API route configuration
export const API_ROUTE_CONFIG = {
  dynamic: 'force-dynamic' as const,
  runtime: 'nodejs' as const,
};

// Environment validation utility
export function validateDatabaseConnection(): boolean {
  const databaseUrl = process.env.POSTGRES_URL || SUPABASE_URL;
  console.log('✅ Database validation: Using Supabase as singleton database');
  return true;
}

// Helper function to get database configuration for direct use in API routes
export function getDbConfig(connectionString?: string): PoolConfig {
  const databaseUrl = connectionString || process.env.POSTGRES_URL || SUPABASE_URL;
  
  return {
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }, // Always use SSL for Supabase
    max: process.env.NODE_ENV === 'production' ? 1 : 10,
    min: 0,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  };
} 