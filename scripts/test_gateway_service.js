
const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

async function testGatewayService() {
    console.log("Testing with SERVICE KEY as Bearer...")
    const resp = await fetch(`${PROJECT_URL}/functions/v1/check-subscription`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json"
        }
    })

    console.log(`Status: ${resp.status}`)
    console.log(`Body: ${await resp.text()}`)
}

testGatewayService()
