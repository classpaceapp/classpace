
import { createClient } from '@supabase/supabase-js'

// Configuration
const OLD_PROJECT = {
    url: 'https://roodcmebqkwmoxrfjdzq.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvb2RjbWVicWt3bW94cmZqZHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTk0NTYsImV4cCI6MjA3NjYzNTQ1Nn0.bZCTCAdg25aSOcs9uRKKrS0vkm-MZFbPO5l6pA68RUc'
}

const NEW_PROJECT = {
    url: 'https://ihfykcnicjdfbsibgcgn.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'
}

const BUCKETS = [
    { name: 'avatars', public: true },
    { name: 'pod-materials', public: false }, // Originally private
    { name: 'interview-recordings', public: false }, // Originally private
    { name: 'teaching-resources', public: true },
    { name: 'lovable-uploads', public: true } // Assuming public
]

const oldClient = createClient(OLD_PROJECT.url, OLD_PROJECT.key)
const newClient = createClient(NEW_PROJECT.url, NEW_PROJECT.key)

// Helper: Recursively list files in a bucket
async function listAllFiles(client, bucketName, path = '') {
    let allFiles = []
    const { data, error } = await client.storage.from(bucketName).list(path, { limit: 100 })

    if (error) {
        console.warn(`Warning listing ${bucketName}/${path}: ${error.message}`)
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
    console.log('🚀 Starting Storage Migration...')

    for (const bucket of BUCKETS) {
        console.log(`\n--------------------------------`)
        console.log(`📦 Processing Bucket: ${bucket.name}`)

        // 1. Create Bucket in New Project
        const { error: createError } = await newClient.storage.createBucket(bucket.name, {
            public: bucket.public,
            fileSizeLimit: 52428800, // 50MB limit example
            allowedMimeTypes: null   // Allow all
        })

        if (createError) {
            if (createError.message.includes('already exists')) {
                console.log(`   (Bucket already exists in new project)`)
            } else {
                console.error(`   ❌ Failed to create bucket: ${createError.message}`)
                continue // Skip if we can't create or access the bucket
            }
        } else {
            console.log(`   ✅ Created bucket (Public: ${bucket.public})`)
        }

        // 2. List Files from Old Project
        console.log(`   🔍 Scanning old project files...`)
        const files = await listAllFiles(oldClient, bucket.name)
        console.log(`   found ${files.length} files.`)

        if (files.length === 0) continue

        // 3. Migrate Files
        let successCount = 0
        let failCount = 0

        for (const file of files) {
            process.stdout.write(`   ➡️ Migrating ${file.fullPath}... `)

            // Download
            const { data: fileData, error: downError } = await oldClient.storage
                .from(bucket.name)
                .download(file.fullPath)

            if (downError) {
                console.log(`❌ Download Fail: ${downError.message}`)
                failCount++
                continue
            }

            // Upload
            const { error: upError } = await newClient.storage
                .from(bucket.name)
                .upload(file.fullPath, fileData, {
                    contentType: file.metadata?.mimetype,
                    upsert: true
                })

            if (upError) {
                console.log(`❌ Upload Fail: ${upError.message}`)
                failCount++
            } else {
                console.log(`✅ OK`)
                successCount++
            }
        }

        console.log(`   Summary: ${successCount} transferred, ${failCount} failed.`)
    }

    console.log('\n✅ Migration Complete!')
}

migrate()
