
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
// Using the KNOWN GOOD Service Key to ensure we generate a valid token signed by the real project secret
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

async function testWithServiceKey() {
    const EMAIL = 'aryamoy03@gmail.com'
    const PASS = 'TemporaryPassword123!'

    console.log(`[TEST] Authenticating with Service Key client...`)
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASS
    })

    if (authError) {
        console.error(`[TEST] Login Failed: ${authError.message}`)
        return
    }

    console.log(`[TEST] Logged in. Token obtained.`)

    // Now invoke the function using this token
    const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${auth.session.access_token}` }
    })

    if (error) {
        console.log(`[FAIL] Error Object:`)
        console.log(JSON.stringify(error, null, 2))
    } else {
        console.log(`[SUCCESS] Data:`)
        console.log(JSON.stringify(data, null, 2))
    }
}

testWithServiceKey()
