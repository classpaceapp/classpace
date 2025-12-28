
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Lig8VlcMiSf6pgcxPK8HZw_L57kxIZ9'

const supabase = createClient(PROJECT_URL, SUPABASE_KEY)

async function verifyGemini() {
    const EMAIL = 'aryamoy03@gmail.com'
    const PASS = 'TemporaryPassword123!'

    try {
        console.log("Logging in...")
        const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
            email: EMAIL,
            password: PASS
        })

        if (authError) throw authError
        const token = auth.session.access_token

        const funcName = 'aurora-interview-questions'
        const url = `${PROJECT_URL}/functions/v1/${funcName}`

        console.log(`Invoking ${url}`)
        const payload = {
            jobDescription: "Software Engineer",
            numQuestions: 1
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })

        const text = await res.text()
        const logContent = `Status: ${res.status}\nBody: ${text}`
        console.log(logContent)

        fs.writeFileSync('verification_error.txt', logContent)

    } catch (e) {
        console.error(e)
        fs.writeFileSync('verification_error.txt', `Exception: ${e.message}\nStack: ${e.stack}`)
    }
}

verifyGemini()
