
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
// The CORRECT key (verified from restore_users.js)
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

async function verifyUser() {
    const EMAIL = 'aryamoy03@gmail.com'
    console.log(`🔎 Verifying User: ${EMAIL}`)

    // 1. Get Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', EMAIL)
        .single()

    if (profileError) {
        console.log(`❌ Profile Error: ${profileError.message}`)
        return
    }
    console.log(`   ✅ Profile Found: ${profile.id}`)

    // 2. Get Auth User
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(profile.id)

    if (authError || !user) {
        console.log(`❌ Auth User NOT Found for ID ${profile.id}`)
        // If not found, try to create it right here to be super helpful
        console.log(`   Health check failed. Attempting immediate repair...`)

        // FETCH FULL PROFILE FIRST
        const { data: fullProfile } = await supabase.from('profiles').select('*').eq('id', profile.id).single()

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            id: profile.id,
            email: EMAIL,
            password: 'TemporaryPassword123!',
            email_confirm: true,
            user_metadata: {
                first_name: fullProfile.first_name,
                last_name: fullProfile.last_name,
                role: fullProfile.role
            }
        })

        if (createError) {
            console.log(`   ❌ Repair Failed: ${createError.message}`)
        } else {
            console.log(`   ✅ REPAIR SUCCESS! Created user ${newUser.user.id}`)
        }

    } else {
        console.log(`   ✅ Auth User Found: ${user.id}`)
        console.log(`   📧 Auth Email:      ${user.email}`)

        if (user.email === EMAIL) {
            console.log(`   🎉 MATCH CONFIRMED! The user is fully restored.`)
        } else {
            console.log(`   ⚠️ Email Mismatch? Profile: ${EMAIL}, Auth: ${user.email}`)
        }
    }
}

verifyUser()
