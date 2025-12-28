
import { createClient } from '@supabase/supabase-js'

// Client-side config (matches .env)
const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvb2RjbWVicWt3bW94cmZqZHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTk0NTYsImV4cCI6MjA3NjYzNTQ1Nn0.bZCTCAdg25aSOcs9uRKKrS0vkm-MZFbPO5l6pA68RUc' // From user .env earlier, or I can use the one I saw in the file view.
// Wait, I should verify the ANON KEY. I saw it in the file view earlier (Step 624).
// It was: VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_Lig8VlcMiSf6pgcxPK8HZw_L57kxIZ9"
// NO, that looks like a custom domain key or something?
// Let me re-read the .env file to be 100% sure I'm using the NEW project's anon key.
// The user updated .env in Step 624.
// VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_Lig8VlcMiSf6pgcxPK8HZw_L57kxIZ9"
// Actually, looking at Step 624 output:
// 2: VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_Lig8VlcMiSf6pgcxPK8HZw_L57kxIZ9"
// That looks weird. Usually it starts with `eyJ...`.
// "sb_publishable_..." might be a new format or an alias?
// Wait, if that IS the key, I should use it.
// BUT, if I want to be safe, I can just read .env again inside the script? No, I'm writing the script.
// Let's assume the user put the correct key in .env. I will read .env dynamically in the script if possible, 
// but node can't read .env automatically without dotenv. I'll just hardcode what I saw in 624.

const SUPABASE_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Lig8VlcMiSf6pgcxPK8HZw_L57kxIZ9'
// NOTE: This key looks suspicious (too short, new format?). 
// If this is wrong, the login will fail. 
// Let's try to proceed. If it fails, I'll know why.

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testFunctions() {
    const EMAIL = 'aryamoy03@gmail.com'
    const PASS = 'TemporaryPassword123!'

    console.log(`1. Logging in as ${EMAIL}...`)
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASS
    })

    if (authError) {
        console.error(`❌ Login Failed: ${authError.message}`)
        return
    }
    console.log(`✅ Logged in. Token: ${auth.session.access_token.substring(0, 20)}...`)

    console.log(`\n2. Invoking 'check-subscription'...`)
    const start1 = Date.now()
    const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${auth.session.access_token}` }
    })
    const time1 = Date.now() - start1

    if (subError) {
        console.error(`❌ Function Error:`, subError)
        // Try to parse if it's a context error
        try { console.error(JSON.stringify(subError, null, 2)) } catch { }
    } else {
        console.log(`✅ Function Responsed (${time1}ms):`)
        console.log(JSON.stringify(subData, null, 2))
    }

    console.log(`\n3. Invoking 'create-checkout'...`)
    const start2 = Date.now()
    const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${auth.session.access_token}` },
        body: { isStudent: false }
    })
    const time2 = Date.now() - start2

    if (checkoutError) {
        console.error(`❌ Function Error:`, checkoutError)
    } else {
        console.log(`✅ Function Responsed (${time2}ms):`)
        console.log(JSON.stringify(checkoutData, null, 2))
    }
}

testFunctions()
