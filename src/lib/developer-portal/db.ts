import { Pool } from 'pg';

// Connection pool configuration for different environments
// Disable SSL certificate verification for development
if (process.env.NODE_ENV === 'development') {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
}

// Primary Supabase database URL - SINGLE SOURCE OF TRUTH
const SUPABASE_URL = 'postgres://postgres.fvbaytzkukfqfpwozbtm:S43TjpedayzcuzoT@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

const getPoolConfig = () => {
  const databaseUrl = process.env.POSTGRES_URL || SUPABASE_URL;
  
  console.log('🔗 Database URL source:', 
    process.env.POSTGRES_URL ? 'POSTGRES_URL (Production Supabase)' : 
    'SUPABASE_URL (Direct Singleton)'
  );
  
  console.log('🔗 Database host:', databaseUrl ? databaseUrl.split('@')[1]?.split('/')[0] : 'NONE');
  
  return {
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }, // Always use SSL for Supabase
    // Serverless-friendly settings
    max: process.env.NODE_ENV === 'development' ? 10 : 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  };
};

// Singleton pattern for development to avoid too many connections
let globalPool: Pool | undefined;

// Create PostgreSQL connection pool
export const pool = globalThis.pool || (() => {
  const newPool = new Pool(getPoolConfig());
  
  // Store in global for development
  if (process.env.NODE_ENV === 'development') {
    globalThis.pool = newPool;
  }
  
  return newPool;
})();

// Handle connection errors
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

// TypeScript declaration for global pool
declare global {
  var pool: Pool | undefined;
}

// Export a function for queries with proper error handling
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
} 