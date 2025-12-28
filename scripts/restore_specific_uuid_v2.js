
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
// The VALID KEY from restore_users.js
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'
// Wait, I need to check the exact string from the file I just read to be 100% sure. 
// I will use the one I see in the previous view_file output but let me double check the previous tool output for restore_users.js

// Re-pasting the key I saw in step 668/669 which WAS working:
// 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw')

async function restoreByUUIDForce() {
    const UUID = 'e3875412-fb9c-4297-88bf-7d92d3b17f2d'
    const EMAIL = 'aryamoy03@gmail.com'

    console.log(`🎯 Force-Restoring User: ${EMAIL}`)
    console.log(`   UUID: ${UUID}`)

    // 1. Try to get metadata, but don't stop if missing
    let meta = {
        first_name: 'Aryamoy', // Fallback
        last_name: 'User',
        role: 'learner'
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', UUID)
        .single()

    if (profile) {
        console.log(`   ✅ Found existing profile data to use.`)
        meta = {
            first_name: profile.first_name || meta.first_name,
            last_name: profile.last_name || meta.last_name,
            role: profile.role || meta.role
        }
    } else {
        console.log(`   ⚠️  Profile not found. Using fallback metadata.`)
    }

    // 2. Create Auth User
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        id: UUID, // Enforce the specific UUID
        email: EMAIL,
        password: 'TemporaryPassword123!',
        email_confirm: true,
        user_metadata: meta
    })

    if (createError) {
        console.error(`   ❌ Creation Failed: ${createError.message}`)
    } else {
        console.log(`   ✅ SUCCESS! Auth User Created.`)
        console.log(`      ID: ${newUser.user.id}`)
    }
}

restoreByUUIDForce()
