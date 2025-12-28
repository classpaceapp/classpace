
const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDI0MTMsImV4cCI6MjA4MjMxODQxM30.RNbn7IgSFPkWsAYOTYHy4tt_KOw0wyarhOHWtwm6Gkk'

async function testGateway() {
    console.log("1. Testing with ANON KEY as Bearer (Should bypass Gateway, fail in code)...")
    const resp = await fetch(`${PROJECT_URL}/functions/v1/check-subscription`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ANON_KEY}`,
            "Content-Type": "application/json"
        }
    })
    console.log(`Status: ${resp.status}`)
    console.log(`Body: ${await resp.text()}`)

    console.log("\n2. Testing with MALFORMED Token (Should fail Gateway)...")
    const resp2 = await fetch(`${PROJECT_URL}/functions/v1/check-subscription`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsIn...Garbage`,
            "Content-Type": "application/json"
        }
    })
    console.log(`Status: ${resp2.status}`)
    console.log(`Body: ${await resp2.text()}`)
}

testGateway()
