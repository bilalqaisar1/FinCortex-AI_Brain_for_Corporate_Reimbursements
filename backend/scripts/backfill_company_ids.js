
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
function loadEnv(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length === 2) {
                process.env[parts[0].trim()] = parts[1].trim();
            }
        });
    } catch (e) { }
}

loadEnv(path.join(__dirname, '../fin-cortex/.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? 'PRESENT' : 'MISSING');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
    console.log('Fetching reimbursements with null company_id...');
    const { data: reimbursements, error: fetchError } = await supabase
        .from('reimbursements')
        .select('reimbursement_id, user_id, manager_id')
        .is('company_id', null);

    if (fetchError) {
        console.error('Error fetching reimbursements:', fetchError);
        return;
    }

    if (!reimbursements || reimbursements.length === 0) {
        console.log('No reimbursements found needing backfill.');
        return;
    }

    console.log(`Found ${reimbursements.length} records to process.`);

    for (const r of reimbursements) {
        let companyId = null;

        // 1. Try User
        const { data: userData } = await supabase
            .from('users')
            .select('company_id')
            .eq('user_id', r.user_id)
            .maybeSingle();

        if (userData && userData.company_id) {
            companyId = userData.company_id;
            console.log(`  Resolved via User ${r.user_id} -> Company ${companyId}`);
        }

        // 2. Try Manager
        if (!companyId && r.manager_id) {
            const { data: mgrData } = await supabase
                .from('managers')
                .select('manager_company_id')
                .eq('manager_id', r.manager_id)
                .maybeSingle();

            if (mgrData && mgrData.manager_company_id) {
                companyId = mgrData.manager_company_id;
                console.log(`  Resolved via Manager ${r.manager_id} -> Company ${companyId}`);
            }
        }

        if (companyId) {
            const { error: updateError } = await supabase
                .from('reimbursements')
                .update({ company_id: companyId })
                .eq('reimbursement_id', r.reimbursement_id);

            if (updateError) {
                console.error(`  ❌ Error updating reimbursement ${r.reimbursement_id}:`, updateError);
            } else {
                console.log(`  ✅ Updated Reimbursement ${r.reimbursement_id}`);
            }
        } else {
            console.log(`  ❌ Could not resolve company for Reimbursement ${r.reimbursement_id}`);
        }
    }
}

backfill();
