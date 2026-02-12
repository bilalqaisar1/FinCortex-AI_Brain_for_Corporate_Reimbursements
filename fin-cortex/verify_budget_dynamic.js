const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv(fp) { try { fs.readFileSync(fp, 'utf8').split('\n').forEach(l => { let p = l.split('='); if (p.length === 2) process.env[p[0].trim()] = p[1].trim() }) } catch (e) { } }
loadEnv('/home/ubuntu/Desktop/FinCortex-AI_Brain_for_Corporate_Reimbursements/fin-cortex/.env');

async function test() {
    const baseUrl = 'http://localhost:3000/api/v1/admin/budgets';
    console.log('Testing Budget API at', baseUrl);

    // 1. GET Budgets
    console.log('\n--- 1. GET Budgets ---');
    let res = await fetch(baseUrl);
    let json = await res.json();
    console.log('Status:', res.status);
    console.log('Count:', json.data ? json.data.length : 0);
    if (json.data && json.data.length > 0) {
        console.log('First budget:', JSON.stringify(json.data[0], null, 2));
    }

    // 2. Create Budget
    console.log('\n--- 2. Create Budget ---');
    const newCompany = `Test Corp ${Date.now()}`;
    const payload = {
        company_name: newCompany,
        total_amount: 100000,
        monthly_limit: 50000
    };
    res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    json = await res.json();
    console.log('Create Status:', res.status);
    console.log('Create Response:', JSON.stringify(json, null, 2));

    if (!json.success) {
        console.error('Failed to create budget. Aborting.');
        return;
    }
    const budgetId = json.data.budget_id;
    console.log('New Budget ID:', budgetId);

    // 3. Add Funds
    console.log('\n--- 3. Add Funds ---');
    res = await fetch(`${baseUrl}/${budgetId}/add-funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50000 })
    });
    json = await res.json();
    console.log('Add Funds Status:', res.status);
    console.log('Add Funds Response:', JSON.stringify(json, null, 2));

    // 4. Verify Update
    console.log('\n--- 4. Verify Update ---');
    res = await fetch(baseUrl);
    json = await res.json();
    const updated = json.data.find(b => b.budget_id === budgetId);
    console.log('Updated Budget:', JSON.stringify(updated, null, 2));

    if (updated.total_amount === 150000) {
        console.log('✅ verification SUCCESS: Total amount updated correctly (100k + 50k = 150k)');
    } else {
        console.log('❌ verification FAILED: Total amount mismatch');
    }
}

test().catch(console.error);
