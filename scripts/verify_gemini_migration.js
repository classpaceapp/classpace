
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Lig8VlcMiSf6pgcxPK8HZw_L57kxIZ9'

const supabase = createClient(PROJECT_URL, SUPABASE_KEY)

async function verifyGemini() {
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

    const funcName = 'aurora-interview-questions'
    const url = `${PROJECT_URL}/functions/v1/${funcName}`

    console.log(`\n------------------------------------------------`)
    console.log(`Testing Function: ${funcName} (Gemini Integration)`)

    // Payload for interview questions
    const payload = {
        jobDescription: "Software Engineer at Google",
        numQuestions: 2
    }

    const start = Date.now()
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    })
    const duration = Date.now() - start

    if (res.ok) {
        console.log(`[${funcName}] ✅ Success! Duration: ${duration}ms`)
        const data = await res.json()
        console.log(`Response Data Preview:`)
        console.log(JSON.stringify(data, null, 2).substring(0, 500) + "...")

        if (data.questions && Array.isArray(data.questions)) {
            console.log(`[PASS] structure is correct (found questions array).`)
        } else {
            console.error(`[FAIL] Response structure is invalid (missing questions array).`)
        }
    } else {
        console.error(`[${funcName}] ❌ Failed! Status: ${res.status}`)
        const text = await res.text()
        console.error(`Error Body: ${text}`)
    }
}

verifyGemini()
