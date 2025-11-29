import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://napscysbreibhxsbucfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcHNjeXNicmVpYmh4c2J1Y2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTIwODYsImV4cCI6MjA3OTIyODA4Nn0.Agju79hJ6_kXXbGQ-IWHEIGxwdb7V3hJ68QdbCVGsPw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdmin() {
  console.log("🔍 Testing Admin Access...");
  
  // 1. Try Login
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@sniperfx.com',
    password: 'Hamza0100@'
  });

  if (authError) {
    console.error("❌ Auth Failed:", authError.message);
    return;
  }

  console.log("✅ Auth Successful. User ID:", auth.user.id);

  // 2. Try Fetching Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .single();

  if (profileError) {
    console.log("⚠️ Profile missing or blocked. Attempting Auto-Repair RPC...");
    
    // 3. Try RPC
    const { error: rpcError } = await supabase.rpc('ensure_user_profile_exists');
    
    if (rpcError) {
        console.error("❌ Auto-Repair Failed:", rpcError.message);
    } else {
        console.log("✅ Auto-Repair RPC executed successfully.");
        // Retry fetch
        const { data: p2 } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single();
        if (p2) {
            console.log("🎉 Profile Recovered!", p2);
        } else {
            console.error("❌ Profile still missing after repair.");
        }
    }
  } else {
    console.log("✅ Profile Found:", profile);
    if (profile.role === 'admin') {
        console.log("🚀 STATUS: READY. Admin access is fully functional.");
    } else {
        console.log("⚠️ User exists but role is '" + profile.role + "'. Auto-repair should fix this on next login.");
    }
  }
}

testAdmin();
