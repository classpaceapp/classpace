
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
// The CORRECT Anon Key I just restored to the .env
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDI0MTMsImV4cCI6MjA4MjMxODQxM30.RNbn7IgSFPkWsAYOTYHy4tt_KOw0wyarhOHWtwm6Gkk'

const supabase = createClient(PROJECT_URL, ANON_KEY)

async function testFetch() {
    const EMAIL = 'aryamoy03@gmail.com'
    const PASS = 'TemporaryPassword123!'

    console.log(`[TEST] Authenticating...`)
    const { data: auth, error } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASS
    })

    if (error || !auth.session) {
        console.log(`Login failed: ${error?.message}`)
        return
    }

    const token = auth.session.access_token
    console.log(`[TEST] Token obtained.`)

    // 1. Test 'create-checkout' (since user mentioned "failed to start checkout")
    console.log(`\n[TEST] 1. fetch 'create-checkout'...`)
    const resp1 = await fetch(`${PROJECT_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ isStudent: true })
    })

    console.log(`[TEST] Status: ${resp1.status} ${resp1.statusText}`)
    const text1 = await resp1.text()
    console.log(`[TEST] Body: ${text1.substring(0, 500)}`) // First 500 chars

    // 2. Test 'check-subscription'
    console.log(`\n[TEST] 2. fetch 'check-subscription'...`)
    const resp2 = await fetch(`${PROJECT_URL}/functions/v1/check-subscription`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })

    console.log(`[TEST] Status: ${resp2.status} ${resp2.statusText}`)
    const text2 = await resp2.text()
    console.log(`[TEST] Body: ${text2.substring(0, 500)}`)
}

testFetch()
