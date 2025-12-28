
import { createClient } from '@supabase/supabase-js'

// Configuration
const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

async function restoreUsers() {
    console.log('🔄 Starting User Synchronization...')
    console.log('   Target: public.profiles -> auth.users')

    // 1. Fetch all Profiles
    // Using Admin/Service Key bypasses RLS, so we see all rows
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role')

    if (profileError) {
        console.error('❌ Error fetching profiles:', profileError.message)
        return
    }

    // 2. Fetch all current Auth Users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
        console.error('❌ Error fetching auth users:', authError.message)
        return
    }

    console.log(`\n📊 Analysis:`)
    console.log(`   - Public Profiles Found: ${profiles.length}`)
    console.log(`   - Auth Users Found:      ${users.length}`)

    // Map existing Auth IDs for quick lookup
    const authMap = new Set(users.map(u => u.id))

    // 3. Restore Missing Users
    let created = 0
    let skipped = 0
    let failed = 0

    for (const profile of profiles) {
        if (authMap.has(profile.id)) {
            skipped++
            continue
        }

        process.stdout.write(`   creating user ${profile.id} (${profile.email})... `)

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            id: profile.id, // CRITICAL: Force the same UUID
            email: profile.email,
            password: 'TemporaryPassword123!', // User will need to reset this or use magic link
            email_confirm: true,
            user_metadata: {
                first_name: profile.first_name,
                last_name: profile.last_name,
                role: profile.role
            }
        })

        if (createError) {
            console.log(`❌ Fail: ${createError.message}`)
            failed++
        } else {
            console.log(`✅ OK`)
            created++
        }
    }

    console.log(`\n✅ Validated: ${profiles.length} Profiles processed.`)
    console.log(`   - Start Count:   ${users.length} Users`)
    console.log(`   - Created:       ${created}`)
    console.log(`   - Skipped:       ${skipped}`)
    console.log(`   - Failed:        ${failed}`)
    console.log(`   - Final Count:   ${users.length + created}`)
}

restoreUsers()
