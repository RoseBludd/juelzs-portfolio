#!/usr/bin/env node

/**
 * Check admin files in different commits to understand what's missing
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 Checking Admin Files Across Commits...\n');

// Function to get files from a specific commit
function getFilesFromCommit(commitHash, pattern = '') {
  try {
    const command = pattern 
      ? `git ls-tree -r ${commitHash} | findstr "${pattern}"`
      : `git ls-tree -r ${commitHash}`;
    
    const output = execSync(command, { encoding: 'utf8' });
    return output.split('\n').filter(line => line.trim());
  } catch (error) {
    console.log(`❌ Error getting files from ${commitHash}:`, error.message);
    return [];
  }
}

// Function to check what admin files exist locally
function getLocalAdminFiles() {
  try {
    const adminDirs = [];
    
    // Check src/app/admin
    if (fs.existsSync('src/app/admin')) {
      const walkDir = (dir, prefix = '') => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const fullPath = `${dir}/${file}`;
          const relativePath = `${prefix}${file}`;
          
          if (fs.statSync(fullPath).isDirectory()) {
            adminDirs.push(`${relativePath}/`);
            walkDir(fullPath, `${relativePath}/`);
          } else {
            adminDirs.push(relativePath);
          }
        });
      };
      
      walkDir('src/app/admin', 'src/app/admin/');
    }
    
    return adminDirs;
  } catch (error) {
    console.log('❌ Error reading local admin files:', error.message);
    return [];
  }
}

console.log('📋 Current Local Admin Files:');
const localAdminFiles = getLocalAdminFiles();
if (localAdminFiles.length > 0) {
  localAdminFiles.forEach(file => console.log(`   ${file}`));
} else {
  console.log('   ❌ No admin files found locally');
}

console.log('\n📋 Admin Files in Commit 3f108aa (before database switch):');
const commit3f108aaFiles = getFilesFromCommit('3f108aa', 'admin');
if (commit3f108aaFiles.length > 0) {
  commit3f108aaFiles.forEach(line => {
    const parts = line.split('\t');
    if (parts.length > 1) {
      console.log(`   ${parts[1]}`);
    }
  });
} else {
  console.log('   ❌ No admin files found in 3f108aa');
}

console.log('\n📋 Admin Files in Commit cf4ca89 (when admin was added):');
const commitCf4ca89Files = getFilesFromCommit('cf4ca89', 'admin');
if (commitCf4ca89Files.length > 0) {
  commitCf4ca89Files.forEach(line => {
    const parts = line.split('\t');
    if (parts.length > 1) {
      console.log(`   ${parts[1]}`);
    }
  });
} else {
  console.log('   ❌ No admin files found in cf4ca89');
}

console.log('\n📋 Admin Files in Current Remote (origin/master):');
const currentRemoteFiles = getFilesFromCommit('origin/master', 'admin');
if (currentRemoteFiles.length > 0) {
  currentRemoteFiles.forEach(line => {
    const parts = line.split('\t');
    if (parts.length > 1) {
      console.log(`   ${parts[1]}`);
    }
  });
} else {
  console.log('   ❌ No admin files found in current remote');
}

console.log('\n🎯 Analysis:');
console.log('- Local admin files:', localAdminFiles.length);
console.log('- 3f108aa admin files:', commit3f108aaFiles.length);
console.log('- cf4ca89 admin files:', commitCf4ca89Files.length);
console.log('- Current remote admin files:', currentRemoteFiles.length);

console.log('\n💡 Recommendation:');
if (commit3f108aaFiles.length > currentRemoteFiles.length) {
  console.log('✅ Commit 3f108aa has more admin files - should restore from there');
} else if (commitCf4ca89Files.length > currentRemoteFiles.length) {
  console.log('✅ Commit cf4ca89 has more admin files - should restore from there');
} else {
  console.log('⚠️ Need to investigate further - admin files might be in a different location');
}
