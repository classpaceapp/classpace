
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
// Confirmed working key from restore_users.js
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

async function debugConflict() {
    const TARGET_EMAIL = 'aryamoy03@gmail.com'
    const TARGET_UUID = 'e3875412-fb9c-4297-88bf-7d92d3b17f2d'

    console.log(`🕵️ Debugging Conflict for: ${TARGET_EMAIL}`)

    // List all users to find by email
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 })

    if (error) {
        console.error(`❌ Error listing users: ${error.message}`)
        return
    }

    const foundUser = users.find(u => u.email.toLowerCase() === TARGET_EMAIL.toLowerCase())

    if (foundUser) {
        console.log(`   ✅ User FOUND by Email.`)
        console.log(`      Current UUID: ${foundUser.id}`)
        console.log(`      Target UUID:  ${TARGET_UUID}`)

        if (foundUser.id === TARGET_UUID) {
            console.log(`   ✅ UUIDs Match! The user is correctly restored.`)
            // If match, maybe just ensure profile exists?
            await ensureProfile(foundUser)
        } else {
            console.log(`   ⚠️  UUID Mismatch!`)
            console.log(`   🛠️  Deleting incorrect user...`)

            const { error: delError } = await supabase.auth.admin.deleteUser(foundUser.id)
            if (delError) {
                console.log(`      ❌ Delete Failed: ${delError.message}`)
                return
            }
            console.log(`      ✅ Deleted. Recreating with CORRECT UUID...`)

            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                id: TARGET_UUID,
                email: TARGET_EMAIL,
                password: 'TemporaryPassword123!',
                email_confirm: true,
                user_metadata: { first_name: 'Aryamoy', last_name: 'User' }
            })

            if (createError) console.log(`      ❌ Re-create Failed: ${createError.message}`)
            else {
                console.log(`      ✅ Fixed! Created user ${newUser.user.id}`)
                await ensureProfile(newUser.user)
            }
        }
    } else {
        console.log(`   ❌ User NOT found by email. Creating now...`)
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            id: TARGET_UUID,
            email: TARGET_EMAIL,
            password: 'TemporaryPassword123!',
            email_confirm: true,
            user_metadata: { first_name: 'Aryamoy', last_name: 'User' }
        })

        if (createError) console.log(`      ❌ Create Failed: ${createError.message}`)
        else {
            console.log(`      ✅ Created user ${newUser.user.id}`)
            await ensureProfile(newUser.user)
        }
    }
}

async function ensureProfile(user) {
    console.log(`   Verifying Profile row...`)
    const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || 'Aryamoy',
        last_name: user.user_metadata?.last_name || 'User',
        role: 'learner',
        updated_at: new Date().toISOString()
    })
    if (error) console.log(`   ❌ Profile Upsert Failed: ${error.message}`)
    else console.log(`   ✅ Profile Row Confirmed.`)
}

debugConflict()
