
import { createClient } from '@supabase/supabase-js'

// Configuration
const OLD_PROJECT = {
    url: 'https://roodcmebqkwmoxrfjdzq.supabase.co',
    // Used for READING (User confirmed contents are public now, or accessible via Anon)
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvb2RjbWVicWt3bW94cmZqZHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTk0NTYsImV4cCI6MjA3NjYzNTQ1Nn0.bZCTCAdg25aSOcs9uRKKrS0vkm-MZFbPO5l6pA68RUc'
}

const NEW_PROJECT = {
    url: 'https://ihfykcnicjdfbsibgcgn.supabase.co',
    // Used for WRITING (Service Role Key bypasses RLS on new project)
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'
}

const BUCKETS = [
    'avatars',
    'pod-materials',
    'interview-recordings',
    'teaching-resources',
    'lovable-uploads' // Included just in case
]

const oldClient = createClient(OLD_PROJECT.url, OLD_PROJECT.key)
const newClient = createClient(NEW_PROJECT.url, NEW_PROJECT.key)

async function listAllFiles(client, bucketName, path = '') {
    let allFiles = []
    // Increased limit for efficiency
    const { data, error } = await client.storage.from(bucketName).list(path, { limit: 100 })

    if (error) {
        if (path === '') console.warn(`   ⚠️  Could not list bucket '${bucketName}': ${error.message}`)
        return []
    }

    for (const item of data) {
        if (item.id === null) {
            // It's a folder
            const folderFiles = await listAllFiles(client, bucketName, `${path}${item.name}/`)
            allFiles = allFiles.concat(folderFiles)
        } else {
            // It's a file
            allFiles.push({ ...item, fullPath: `${path}${item.name}` })
        }
    }
    return allFiles
}

async function migrate() {
    console.log('🚀 Starting Storage Content Migration (Content Only)...')

    for (const bucketName of BUCKETS) {
        console.log(`\n--------------------------------`)
        console.log(`📦 Processing Bucket: ${bucketName}`)

        // Skip Create Bucket step as requested

        // 1. List Files from Old Project
        console.log(`   🔍 Scanning old project files...`)
        const files = await listAllFiles(oldClient, bucketName)
        console.log(`   found ${files.length} files.`)

        if (files.length === 0) continue

        // 2. Migrate Files
        let successCount = 0
        let failCount = 0

        for (const file of files) {
            // Download
            const { data: fileData, error: downError } = await oldClient.storage
                .from(bucketName)
                .download(file.fullPath)

            if (downError) {
                console.log(`   ❌ Download Fail (${file.fullPath}): ${downError.message}`)
                failCount++
                continue
            }

            // Upload
            const { error: upError } = await newClient.storage
                .from(bucketName)
                .upload(file.fullPath, fileData, {
                    contentType: file.metadata?.mimetype,
                    upsert: true
                })

            if (upError) {
                console.log(`   ❌ Upload Fail (${file.fullPath}): ${upError.message}`)
                failCount++
            } else {
                process.stdout.write('.') // Progress dot
                successCount++
            }
        }

        console.log(`\n   Summary: ${successCount} transferred, ${failCount} failed.`)
    }

    console.log('\n✅ Migration Complete!')
}

migrate()
