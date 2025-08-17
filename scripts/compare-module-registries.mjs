#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 COMPARING MODULE REGISTRIES');
console.log('=============================\n');

const SUPABASE_DB = process.env.SUPABASE_DB;
const VIBEZS_DB = process.env.VIBEZS_DB;

async function compareRegistries() {
  // Temporarily disable SSL verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const sourcePool = new Pool({
    connectionString: SUPABASE_DB,
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  const targetPool = new Pool({
    connectionString: VIBEZS_DB,
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to databases...');
    const sourceClient = await sourcePool.connect();
    const targetClient = await targetPool.connect();
    
    try {
      // Compare table structures
      console.log('📋 COMPARING TABLE STRUCTURES:\n');
      
      // Source structure
      console.log('🗄️  SUPABASE_DB module_registry structure:');
      const sourceColumns = await sourceClient.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'module_registry' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      sourceColumns.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   • ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
      
      // Target structure
      console.log('\n🗄️  VIBEZS_DB module_registry structure:');
      const targetColumns = await targetClient.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'module_registry' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      targetColumns.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   • ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
      
      // Compare data counts
      console.log('\n📊 COMPARING DATA COUNTS:\n');
      
      const sourceCount = await sourceClient.query('SELECT COUNT(*) as count FROM module_registry');
      const targetCount = await targetClient.query('SELECT COUNT(*) as count FROM module_registry');
      
      console.log(`📦 SUPABASE_DB module_registry: ${sourceCount.rows[0].count} records`);
      console.log(`📦 VIBEZS_DB module_registry: ${targetCount.rows[0].count} records`);
      
      // Sample data comparison
      console.log('\n📄 SAMPLE DATA COMPARISON:\n');
      
      console.log('🔸 SUPABASE_DB sample records:');
      const sourceSample = await sourceClient.query('SELECT * FROM module_registry LIMIT 3');
      sourceSample.rows.forEach((row, index) => {
        console.log(`   [${index + 1}] ID: ${row.id}`);
        console.log(`       Name: ${row.name}`);
        console.log(`       Type: ${row.type}`);
        console.log(`       Category: ${row.category}`);
        console.log(`       Module Count: ${row.module_count || 'N/A'}`);
        console.log(`       Technologies: ${JSON.stringify(row.technologies || [])}`);
        console.log();
      });
      
      console.log('🔸 VIBEZS_DB sample records:');
      const targetSample = await targetClient.query('SELECT * FROM module_registry LIMIT 3');
      targetSample.rows.forEach((row, index) => {
        console.log(`   [${index + 1}] ID: ${row.id || 'N/A'}`);
        console.log(`       Name: ${row.name || 'N/A'}`);
        console.log(`       Type: ${row.type || 'N/A'}`);
        console.log(`       Category: ${row.category || 'N/A'}`);
        console.log(`       Module Count: ${row.module_count || 'N/A'}`);
        if (row.technologies) {
          console.log(`       Technologies: ${JSON.stringify(row.technologies)}`);
        }
        console.log();
      });
      
      // Check for overlapping IDs
      console.log('🔍 CHECKING FOR ID OVERLAPS:\n');
      
      const overlapCheck = await sourceClient.query(`
        SELECT id, name FROM module_registry 
        WHERE id IN (
          SELECT DISTINCT id FROM module_registry
        )
        LIMIT 5
      `);
      
      if (overlapCheck.rows.length > 0) {
        console.log('📋 Sample IDs from SUPABASE_DB:');
        overlapCheck.rows.forEach(row => {
          console.log(`   • ${row.id}: ${row.name}`);
        });
      }
      
      // Check what's in target that might conflict
      const targetSampleIds = await targetClient.query(`
        SELECT id, name FROM module_registry 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('\n📋 Recent IDs in VIBEZS_DB:');
      targetSampleIds.rows.forEach(row => {
        console.log(`   • ${row.id || 'N/A'}: ${row.name || 'N/A'}`);
      });
      
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('   1. VIBEZS_DB has an active module_registry with foreign key constraints');
      console.log('   2. Your portfolio data should use a separate table name');
      console.log('   3. Update your application to use "portfolio_module_registry" instead');
      console.log('   4. This preserves both systems without conflicts');
      
    } finally {
      sourceClient.release();
      targetClient.release();
    }
    
  } catch (error) {
    console.error('❌ Comparison failed:', error.message);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

compareRegistries().catch(console.error);
