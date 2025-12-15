import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🚑 STARTING EMERGENCY DATABASE REPAIR...');
console.log('=======================================');

if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === 'YOUR_API_KEY') {
  console.error('❌ CANNOT AUTO-APPLY FIX: Missing Service Role Key.');
  console.log('   The "500 Database Error" is a server-side issue.');
  console.log('   You MUST apply the fix manually.');
  console.log('\n👉 ACTION REQUIRED:');
  console.log('   1. Copy the content of: supabase/migrations/20250210000000_fix_login_schema_error.sql');
  console.log('   2. Go to your Supabase Dashboard > SQL Editor');
  console.log('   3. Paste and Run the SQL.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function applyFix() {
  try {
    const sqlPath = path.join(__dirname, '../supabase/migrations/20250210000000_fix_login_schema_error.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('   Applying SQL migration to fix triggers...');
    
    // Note: supabase-js doesn't have a direct 'query' method for raw SQL unless using pg-node or similar,
    // but often projects have a wrapper or RPC. 
    // Since we are in a constrained environment, we will try to use a common RPC pattern if it exists,
    // or just warn the user again if we can't execute raw SQL.
    
    // Attempting to use a system RPC if available, otherwise falling back to instructions.
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        // If the RPC doesn't exist (likely), we can't run SQL from here.
        console.log('   ⚠️  Could not execute SQL directly (RPC missing).');
        console.log('   Please run the SQL manually in the Dashboard.');
    } else {
        console.log('   ✅ SQL Applied Successfully!');
    }

  } catch (err) {
    console.error('   ❌ Error:', err.message);
  }
}

applyFix();
