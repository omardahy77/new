import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sthqwnxqxjcvahfxwjyq.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Robust check for Service Key
const hasServiceKey = serviceRoleKey && !serviceRoleKey.includes('*') && serviceRoleKey.length > 20;

// Initialize Supabase
const supabase = createClient(supabaseUrl, hasServiceKey ? serviceRoleKey : anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    console.log('\n🔧 STARTING MASTER ADMIN REPAIR...');
    console.log('---------------------------------------');
    
    const password = 'Hamza0100@';
    
    // 1. Try Primary Admin
    const primaryEmail = 'admin@sniperfx.com';
    console.log(`👉 Attempting to fix: ${primaryEmail}`);
    
    if (hasServiceKey) {
        await fixUserWithServiceKey(primaryEmail, password);
    } else {
        const success = await tryPublicFix(primaryEmail, password);
        if (!success) {
            // 2. Fallback to Recovery Admin
            console.log('\n⚠️ Primary admin locked. Trying Recovery Admin...');
            const recoveryEmail = 'recovery@sniperfx.com';
            const recSuccess = await tryPublicFix(recoveryEmail, password);
            
            if (!recSuccess) {
                // 3. Fallback to Unique Admin (Last Resort)
                console.log('\n⚠️ Recovery admin locked. Generating Emergency Access...');
                const randomSuffix = Math.floor(Math.random() * 1000);
                const emergencyEmail = `admin${randomSuffix}@sniperfx.com`;
                await tryPublicFix(emergencyEmail, password);
            }
        }
    }
}

async function fixUserWithServiceKey(email, password) {
    try {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const user = users.find(u => u.email === email);
        
        if (user) {
            await supabase.auth.admin.updateUserById(user.id, { 
                password, email_confirm: true, user_metadata: { role: 'admin' } 
            });
            console.log(`   ✅ Fixed existing user: ${email}`);
            await ensureProfile(user.id, email);
        } else {
            const { data } = await supabase.auth.admin.createUser({
                email, password, email_confirm: true, user_metadata: { role: 'admin' }
            });
            console.log(`   ✅ Created new user: ${email}`);
            await ensureProfile(data.user.id, email);
        }
        printSuccess(email, password);
    } catch (e) {
        console.error('   ❌ Service Key Error:', e.message);
    }
}

async function tryPublicFix(email, password) {
    try {
        // Try Login First (to see if password works)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (signInData?.user) {
            console.log(`   ✅ Login successful for: ${email}`);
            await ensureProfile(signInData.user.id, email);
            printSuccess(email, password);
            return true;
        }

        // If login failed, try SignUp
        if (signInError && signInError.message.includes('Invalid login')) {
            console.log(`   ❌ Password mismatch for ${email}. Cannot reset without Service Key.`);
            return false; 
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email, password, options: { data: { full_name: 'Admin', role: 'admin' } }
        });

        if (signUpData?.user) {
            if (!signUpData.session) {
                console.log(`   ⚠️  User created but requires Email Confirmation: ${email}`);
                console.log('   👉 DISABLE "Confirm Email" in Supabase Dashboard to use this account.');
                return false;
            }
            console.log(`   ✅ Created new user: ${email}`);
            await ensureProfile(signUpData.user.id, email);
            printSuccess(email, password);
            return true;
        }
        
        if (signUpError) {
            console.log(`   ❌ SignUp failed: ${signUpError.message}`);
            return false;
        }
        
        return false;
    } catch (e) {
        console.error('   ❌ Error:', e.message);
        return false;
    }
}

async function ensureProfile(userId, email) {
    // Try to upsert profile. 
    // Note: If using Anon Key, RLS might block UPDATE if we don't own the row.
    // But INSERT should work if it doesn't exist.
    
    const { error } = await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        full_name: 'Admin',
        role: 'admin',
        status: 'active',
        updated_at: new Date().toISOString()
    });

    if (error) {
        // If upsert failed (likely RLS on update), try simple insert (ignore conflict)
        if (error.code === '42501') { // Permission denied
             console.log('   ⚠️  RLS blocked profile update. Assuming profile exists.');
        } else {
             console.log(`   ⚠️  Profile sync warning: ${error.message}`);
        }
    } else {
        console.log('   ✅ Profile synced.');
    }
}

function printSuccess(email, password) {
    console.log('\n✨ LOGIN SUCCESSFUL! USE THESE CREDENTIALS:');
    console.log('---------------------------------------');
    console.log(`   📧 Email:    ${email}`);
    console.log(`   🔑 Password: ${password}`);
    console.log('---------------------------------------\n');
}

run();
