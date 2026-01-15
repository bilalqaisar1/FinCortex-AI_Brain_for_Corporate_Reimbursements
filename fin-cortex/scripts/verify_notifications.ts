import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Mock dotenv.config({ path: '.env.local' })
try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8')
        envContent.split('\n').forEach(line => {
            const [key, ...values] = line.split('=')
            if (key && values.length > 0) {
                process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '')
            }
        })
    }
} catch (e) {
    console.warn('Could not load .env.local manually:', e)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTable() {
    console.log('Checking in_app_notifications table...')

    // 1. Check if table exists and we can select from it
    const { data, error, count } = await supabase
        .from('in_app_notifications')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error querying table:', error)
    } else {
        console.log('Table exists. Notification count:', count)
    }

    // 2. Check structure (if possible via RPC or just getting one row)
    const { data: oneRow, error: rowError } = await supabase
        .from('in_app_notifications')
        .select('*')
        .limit(1)

    if (rowError) {
        console.error('Error fetching one row:', rowError)
    } else {
        console.log('Sample row / Columns check:', oneRow?.[0] ? Object.keys(oneRow[0]) : 'No rows found to check columns')
    }

    // 3. Check RLS policies
    const { data: policies, error: polError } = await supabase
        .rpc('get_policies', { table_name: 'in_app_notifications' }) // This might not exist, alternative is querying pg_policies

    // Fallback to direct query on pg_policies
    const { data: pgPolicies, error: pgPolError } = await supabase
        .from('pg_policies') // Might not be accessible depending on permissions
        .select('*')
        .eq('tablename', 'in_app_notifications')
        .eq('schemaname', 'public')

    if (pgPolError) {
        const { data: polData, error: polExError } = await supabase.rpc('execute_sql', {
            sql: "SELECT * FROM pg_policies WHERE tablename = 'in_app_notifications'"
        })
        if (polExError) {
            console.log('Could not fetch policies via RPC either.')
        } else {
            console.log('Policies for in_app_notifications:', polData)
        }
    } else {
        console.log('Policies for in_app_notifications:', pgPolicies)
    }
}

checkTable()
