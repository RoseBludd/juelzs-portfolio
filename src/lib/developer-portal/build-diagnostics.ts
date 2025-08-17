// Build-time diagnostics utility
export function checkBuildEnvironment(): boolean {
  console.log('🔍 Checking build environment...');
  
  // Check critical environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
  }
  
  // Check if we're in a build context
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  const isVercel = process.env.VERCEL === '1';
  
  console.log(`📦 Build context: ${isBuildTime ? 'Build time' : 'Runtime'}`);
  console.log(`☁️ Platform: ${isVercel ? 'Vercel' : 'Other'}`);
  
  // Skip database checks during build
  if (isBuildTime) {
    console.log('⏭️ Skipping database connectivity check during build');
    return false; // Return false to indicate we should skip DB operations
  }
  
  return true; // OK to proceed with database operations
}

// Safe database operation wrapper
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string = 'database operation'
): Promise<T> {
  try {
    // Check if we should skip database operations
    if (!checkBuildEnvironment()) {
      console.log(`⏭️ Skipping ${operationName} during build`);
      return fallback;
    }
    
    return await operation();
  } catch (error) {
    console.error(`❌ Error in ${operationName}:`, error);
    return fallback;
  }
} 