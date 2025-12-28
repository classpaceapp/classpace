
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Lig8VlcMiSf6pgcxPK8HZw_L57kxIZ9'

const supabase = createClient(PROJECT_URL, SUPABASE_KEY)

async function testFetch() {
    const EMAIL = 'aryamoy03@gmail.com'
    const PASS = 'TemporaryPassword123!'

    console.log(`[TEST] Authenticating...`)
    const { data: auth } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASS
    })

    if (!auth.session) {
        console.log("Login failed")
        return
    }

    const token = auth.session.access_token
    console.log(`[TEST] Token obtained. Fetching 'check-subscription'...`)

    const resp = await fetch(`${PROJECT_URL}/functions/v1/check-subscription`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })

    console.log(`[TEST] Status: ${resp.status} ${resp.statusText}`)
    const text = await resp.text()
    console.log(`[TEST] Body:`)
    console.log(text)
}

testFetch()
