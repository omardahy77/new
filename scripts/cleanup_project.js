import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptsDir = __dirname;

// List of files to KEEP (Essential tools)
const KEEP_FILES = [
  'create_admin.js',
  'seed_full_content.js',
  'cleanup_project.js'
];

console.log('\n🧹 STARTING PROJECT CLEANUP...');
console.log('==============================');

fs.readdir(scriptsDir, (err, files) => {
  if (err) {
    console.error('❌ Error reading scripts directory:', err);
    return;
  }

  let deletedCount = 0;

  files.forEach(file => {
    if (!KEEP_FILES.includes(file) && file.endsWith('.js')) {
      const filePath = path.join(scriptsDir, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`   🗑️  Deleted: ${file}`);
        deletedCount++;
      } catch (e) {
        console.error(`   ⚠️  Failed to delete ${file}:`, e.message);
      }
    }
  });

  console.log('==============================');
  console.log(`🎉 Cleanup Complete. Removed ${deletedCount} temporary scripts.`);
  console.log('   Your project is now clean and production-ready.');
});
