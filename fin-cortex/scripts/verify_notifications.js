
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple .env parser
function loadEnv() {
    try {
        const envFile = fs.readFileSync('.env', 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
            }
        });
    } catch (e) {
        console.log('No .env file found or error reading it');
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables. URL:', !!supabaseUrl, 'Key:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
    console.log('--- Database Verification ---');

    // 1. Check if table exists
    const { data, error, count } = await supabase
        .from('in_app_notifications')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Table Check Failed:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('⚠️ The table in_app_notifications seems to be missing!');
        }
    } else {
        console.log('✅ Table exists. Current notification count:', count);
    }

    // 2. Column Check
    const { data: oneRow, error: rowError } = await supabase
        .from('in_app_notifications')
        .select('*')
        .limit(1);

    if (rowError) {
        console.error('❌ Row Fetch Failed:', rowError.message);
    } else if (oneRow && oneRow.length > 0) {
        console.log('✅ Sample row columns:', Object.keys(oneRow[0]));
    } else {
        console.log('ℹ️ Table is empty, cannot verify columns from rows.');
    }

    // 3. RLS Check (via direct query)
    console.log('\n--- RLS Policy Check ---');
    // We try to query pg_policies via a raw RPC if available, or just try to see if we can read it.
    const { data: policies, error: polError } = await supabase
        .from('pg_policies')
        .select('policyname, cmd, qual, with_check')
        .eq('tablename', 'in_app_notifications');

    if (polError) {
        console.log('ℹ️ Cannot read pg_policies directly. This is expected if not superuser.');
    } else if (policies && policies.length > 0) {
        console.log('✅ Found policies:');
        policies.forEach(p => console.log(`- [${p.cmd}] ${p.policyname}`));
    } else {
        console.log('⚠️ No policies found for in_app_notifications. RLS might be disabled or missing policies.');
    }

    console.log('---------------------------');
}

checkTable();
