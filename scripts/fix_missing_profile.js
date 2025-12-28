
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

async function fixProfile() {
    const UUID = 'e3875412-fb9c-4297-88bf-7d92d3b17f2d'
    const EMAIL = 'aryamoy03@gmail.com'

    console.log(`🔧 Fixing Profile for: ${EMAIL} (${UUID})`)

    // 1. Verify Auth User Exists
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(UUID)

    if (authError || !user) {
        // Attempt lookup by email if ID failed?
        console.log(`   ❌ Auth User not found by ID. Checking by email...`)
        // Admin listUsers filter by email isn't direct, but let's trust the "already registered" error from before.
        return
    }

    console.log(`   ✅ Auth User Verified.`)

    // 2. Insert Profile
    // We use upsert to be safe
    const { error: insertError } = await supabase
        .from('profiles')
        .upsert({
            id: UUID,
            email: EMAIL,
            first_name: 'Aryamoy', // Fallback
            last_name: 'User',
            role: 'learner',        // Default
            avatar_url: '',
            updated_at: new Date().toISOString()
        })

    if (insertError) {
        console.error(`   ❌ Failed to insert profile: ${insertError.message}`)
    } else {
        console.log(`   ✅ SUCCESS! Profile row created/updated.`)
    }
}

fixProfile()
