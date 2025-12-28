
import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
// The suspect key from the .env
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDI0MTMsImV4cCI6MjA4MjMxODQxM30.RNbn7IgSFPkWsAYOTYHy4tt_KOw0wyarhOHWtwm6Gkk'

const supabase = createClient(PROJECT_URL, ANON_KEY)

async function testDB() {
    console.log("Testing DB Access with ANON KEY...")

    const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

    if (error) {
        console.log(`❌ FAILED. Code: ${error.code}. Message: ${error.message}`)
        console.log(`Error Object: ${JSON.stringify(error, null, 2)}`)
    } else {
        console.log(`✅ SUCCESS! Key is valid for Database. (Count: ${count})`)
    }
}

testDB()
