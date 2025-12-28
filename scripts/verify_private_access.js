
import { createClient } from '@supabase/supabase-js'

const OLD_PROJECT_URL = 'https://roodcmebqkwmoxrfjdzq.supabase.co'
const OLD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvb2RjbWVicWt3bW94cmZqZHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTk0NTYsImV4cCI6MjA3NjYzNTQ1Nn0.bZCTCAdg25aSOcs9uRKKrS0vkm-MZFbPO5l6pA68RUc'

const supabase = createClient(OLD_PROJECT_URL, OLD_ANON_KEY)

async function checkPrivateBucket() {
    console.log('Attempting to list files in private bucket "pod-materials"...')
    const { data, error } = await supabase
        .storage
        .from('pod-materials')
        .list('', { limit: 5 })

    if (error) {
        console.error('❌ ACCESS DENIED:', error.message)
        console.log('Reason: This bucket is private. Anon Key cannot read it.')
    } else {
        console.log(`✅ ACCESS GRANTED? Found ${data.length} items.`)
    }
}

checkPrivateBucket()
