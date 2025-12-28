
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDI0MTMsImV4cCI6MjA4MjMxODQxM30.RNbn7IgSFPkWsAYOTYHy4tt_KOw0wyarhOHWtwm6Gkk'

function decode(t) {
    try {
        const part = t.split('.')[1]
        const buf = Buffer.from(part, 'base64')
        const json = JSON.parse(buf.toString())
        console.log(JSON.stringify(json, null, 2))
    } catch (e) {
        console.error("Failed to decode:", e.message)
    }
}

decode(token)
