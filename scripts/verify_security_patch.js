
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Lig8VlcMiSf6pgcxPK8HZw_L57kxIZ9'

const supabase = createClient(PROJECT_URL, SUPABASE_KEY)

async function verifyPatches() {
    const EMAIL = 'aryamoy03@gmail.com'
    const PASS = 'TemporaryPassword123!'

    console.log(`[VERIFY] Logging in...`)
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASS
    })

    if (authError) {
        console.error(`[VERIFY] ❌ Login Failed: ${authError.message}`)
        return
    }
    const token = auth.session.access_token
    console.log(`[VERIFY] ✅ Logged in.`)

    const functionsToTest = [
        'aurora-interview-questions'
    ]
    // Only testing one first to be fast

    for (const funcName of functionsToTest) {
        const url = `${PROJECT_URL}/functions/v1/${funcName}`
        console.log(`\n------------------------------------------------`)
        console.log(`Testing Function: ${funcName} (${url})`)

        // 1. Positive Test (Valid Token)
        console.log(`[${funcName}] Invoking with VALID token...`)
        const resPos = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ numQuestions: 1 }) // Minimal valid body
        })

        if (resPos.status === 401) {
            console.error(`[${funcName}] ❌ FAILED Positive Test: Got 401 Unauthorized with valid token!`)
            const text = await resPos.text()
            console.error(`Response: ${text}`)
        } else {
            console.log(`[${funcName}] ✅ Passed Positive Test. Status: ${resPos.status}`)
        }

        // 2. Negative Test (Invalid Token)
        console.log(`[${funcName}] Invoking with INVALID token...`)
        const resNeg = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer invalid-token-123`
            },
            body: JSON.stringify({ numQuestions: 1 })
        })

        if (resNeg.status === 401) {
            console.log(`[${funcName}] ✅ Passed Negative Test (Got 401).`)
        } else {
            console.error(`[${funcName}] ❌ FAILED Negative Test: Status ${resNeg.status} (Expected 401)`)
            const text = await resNeg.text()
            console.error(`Response: ${text.substring(0, 200)}`)
        }

        // 3. Negative Test (No Token)
        console.log(`[${funcName}] Invoking with NO token...`)
        const resNo = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ numQuestions: 1 })
        })

        if (resNo.status === 401) {
            console.log(`[${funcName}] ✅ Passed No Token Test (Got 401).`)
        } else {
            console.error(`[${funcName}] ❌ FAILED No Token Test: Status ${resNo.status} (Expected 401)`)
        }
    }
}

verifyPatches()
