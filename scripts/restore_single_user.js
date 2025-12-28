
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvb2RjbWVicWt3bW94cmZqZHpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

async function restoreSingleUser() {
    const EMAIL = 'aryamoy03@gmail.com'
    console.log(`🔍 Looking up profile for: ${EMAIL}`)

    // 1. Get UUID from Profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('email', EMAIL)
        .single()

    if (profileError || !profile) {
        console.error('❌ Profile not found!', profileError?.message)
        return
    }

    console.log(`   ✅ Found Profile UUID: ${profile.id}`)

    // 2. Check if Auth User exists
    const { data: { user }, error: authCheckError } = await supabase.auth.admin.getUserById(profile.id)

    if (user) {
        console.log('   ⚠️  Auth User already exists for this UUID.')
        console.log(`      Email: ${user.email}`)
        return
    }

    // 3. Create Auth User
    console.log('   ➕ Creating Auth User...')
    const { data: createUser, error: createError } = await supabase.auth.admin.createUser({
        id: profile.id,
        email: EMAIL,
        password: 'TemporaryPassword123!',
        email_confirm: true,
        user_metadata: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: profile.role
        }
    })

    if (createError) {
        console.error('   ❌ Failed to create user:', createError.message)
    } else {
        console.log('   ✅ User Created Successfully!')
        console.log(`      UUID: ${createUser.user.id}`)
        console.log(`      Email: ${createUser.user.email}`)
    }
}

restoreSingleUser()
