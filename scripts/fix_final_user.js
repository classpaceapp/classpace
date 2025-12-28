
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
// COPYING KEY EXACTLY FROM LINE 6 OF restore_users.js
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

async function fixFinalUser() {
    const TARGET_EMAIL = 'aryamoy03@gmail.com'
    const TARGET_UUID = 'e3875412-fb9c-4297-88bf-7d92d3b17f2d'

    console.log(`🔧 FIXING: ${TARGET_EMAIL}`)

    // 1. DELETE EXISTING USER BY EMAIL (If any, to clear conflicts)
    // We need to list first to find ID
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    if (error) {
        console.log(`❌ LIST ERROR: ${error.message}`) // If this prints, key is still wrong
        return
    }

    const existing = users.find(u => u.email.toLowerCase() === TARGET_EMAIL.toLowerCase())
    if (existing) {
        console.log(`   Found existing user (ID: ${existing.id}). Deleting...`)
        await supabase.auth.admin.deleteUser(existing.id)
        console.log(`   ✅ Deleted.`)
    } else {
        console.log(`   No existing user found by email.`)
    }

    // 2. CREATE NEW USER WITH CORRECT UUID
    console.log(`   Creating fresh user with UUID: ${TARGET_UUID}...`)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        id: TARGET_UUID,
        email: TARGET_EMAIL,
        password: 'TemporaryPassword123!',
        email_confirm: true,
        user_metadata: {
            first_name: 'Aryamoy',
            last_name: 'User',
            role: 'learner'
        }
    })

    if (createError) {
        console.log(`❌ CREATE ERROR: ${createError.message}`)
        return
    }
    console.log(`   ✅ Auth User Created!`)

    // 3. FORCE CREATE PROFILE
    // The trigger might handle it, but let's be 100% sure
    console.log(`   Upserting Profile...`)
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: TARGET_UUID,
        email: TARGET_EMAIL,
        first_name: 'Aryamoy',
        last_name: 'User',
        role: 'learner',
        updated_at: new Date().toISOString()
    })

    if (profileError) console.log(`❌ PROFILE ERROR: ${profileError.message}`)
    else console.log(`   ✅ Profile Synced.`)

}

fixFinalUser()
