
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

async function restoreByUUIDForce() {
    const UUID = 'e3875412-fb9c-4297-88bf-7d92d3b17f2d'
    const EMAIL = 'aryamoy03@gmail.com'

    console.log(`🎯 Force-Restoring User: ${EMAIL}`)
    console.log(`   UUID: ${UUID}`)

    // 1. Try to get metadata, but don't stop if missing
    let meta = {
        first_name: 'Aryamoy', // Fallback based on email
        last_name: 'User',
        role: 'learner'     // Default role
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
        console.log(`       (The 'handle_new_user' trigger should create the profile for us)`)
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
