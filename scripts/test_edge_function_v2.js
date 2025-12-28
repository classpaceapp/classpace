
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
// Using the "sb_publishable_..." key I saw earlier, assuming it works for login as per previous run logs
const SUPABASE_KEY = 'sb_publishable_Lig8VlcMiSf6pgcxPK8HZw_L57kxIZ9'

const supabase = createClient(PROJECT_URL, SUPABASE_KEY)

async function testFunctions() {
    const EMAIL = 'aryamoy03@gmail.com'
    const PASS = 'TemporaryPassword123!'

    console.log(`[TEST] Authenticating...`)
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASS
    })

    if (authError) {
        console.error(`[TEST] Login Failed: ${authError.message}`)
        return
    }

    console.log(`[TEST] Logged in. Testing 'check-subscription'...`)

    const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${auth.session.access_token}` }
    })

    if (error) {
        console.log(`[FAIL] Error Object:`)
        console.log(JSON.stringify(error, null, 2))

        // Sometimes it's a "FunctionsHttpError" with a context
        if (error.context) {
            console.log(`[FAIL] Context:`)
            console.log(JSON.stringify(error.context, null, 2))
        }
    } else {
        console.log(`[SUCCESS] Data:`)
        console.log(JSON.stringify(data, null, 2))
    }
}

testFunctions()
