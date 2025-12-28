
import { createClient } from '@supabase/supabase-js'

const OLD_PROJECT_URL = 'https://roodcmebqkwmoxrfjdzq.supabase.co'
const OLD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvb2RjbWVicWt3bW94cmZqZHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTk0NTYsImV4cCI6MjA3NjYzNTQ1Nn0.bZCTCAdg25aSOcs9uRKKrS0vkm-MZFbPO5l6pA68RUc'

const supabase = createClient(OLD_PROJECT_URL, OLD_ANON_KEY)

async function testBucketAccess(bucketName) {
  console.log(`Checking bucket: ${bucketName}...`)
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .list('', { limit: 5 })

  if (error) {
    console.error(`❌ Error accessing ${bucketName}:`, error.message)
  } else {
    console.log(`✅ Success ${bucketName}. Found ${data.length} items.`)
    if (data.length > 0) console.log('Sample:', data[0].name)
  }
}

async function run() {
  await testBucketAccess('avatars')           // Expected: Success (Public)
  await testBucketAccess('teaching-resources')// Expected: Success (Public)
  await testBucketAccess('pod-materials')     // Expected: Fail (Private) users only
  await testBucketAccess('lovable-uploads')   // Expected: ?
}

run()
