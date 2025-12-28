
import { createClient } from '@supabase/supabase-js'

// Configuration
const OLD_PROJECT = {
    url: 'https://roodcmebqkwmoxrfjdzq.supabase.co',
    // User says buckets are public, so Anon Key should work for listing
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvb2RjbWVicWt3bW94cmZqZHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTk0NTYsImV4cCI6MjA3NjYzNTQ1Nn0.bZCTCAdg25aSOcs9uRKKrS0vkm-MZFbPO5l6pA68RUc'
}

const NEW_PROJECT = {
    url: 'https://ihfykcnicjdfbsibgcgn.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'
}

const BUCKETS = [
    'avatars',
    'pod-materials',
    'interview-recordings',
    'teaching-resources',
    'lovable-uploads'
]

const oldClient = createClient(OLD_PROJECT.url, OLD_PROJECT.key)
const newClient = createClient(NEW_PROJECT.url, NEW_PROJECT.key)

async function countFiles(client, bucketName, projectLabel) {
    let count = 0
    let errorMsg = null

    try {
        const { data, error } = await client.storage.from(bucketName).list('', { limit: 1000 }) // Simple flat list for now
        if (error) {
            errorMsg = error.message
        } else {
            count = data.length
            // Basic check for nested folders (if count is low but folders exist)
            for (const item of data) {
                if (item.id === null) { // It's a folder
                    const { data: subData } = await client.storage.from(bucketName).list(item.name, { limit: 1000 })
                    if (subData) count += subData.length
                }
            }
        }
    } catch (err) {
        errorMsg = err.message
    }

    return { count, error: errorMsg }
}

async function verify() {
    console.log('📊 Storage Integrity Report')
    console.log('===========================')
    console.log(`Bucket                  Old Project (Public?)   New Project (Service Key)   Match?`)
    console.log(`----------------------------------------------------------------------------------`)

    for (const bucket of BUCKETS) {
        const oldRes = await countFiles(oldClient, bucket, 'OLD')
        const newRes = await countFiles(newClient, bucket, 'NEW')

        let oldStr = oldRes.error ? `ERR: ${oldRes.error.substring(0, 10)}...` : `${oldRes.count} files`
        let newStr = newRes.error ? `ERR: ${newRes.error.substring(0, 10)}...` : `${newRes.count} files`
        let match = (oldRes.count === newRes.count && !oldRes.error && !newRes.error) ? '✅' : '❌'

        console.log(`${bucket.padEnd(24)} ${oldStr.padEnd(24)} ${newStr.padEnd(28)} ${match}`)
    }
}

verify()
