
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Configuration
const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
// CORRECT KEY (Verified from restore_users.js - starts with Imlo...)
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

// Product IDs
const TEACHER_PRODUCT_ID = 'prod_TJeHNIEXymOooF'
const STUDENT_PRODUCT_ID = 'prod_TK2C5qgNV85Jlc'

async function syncSubscriptions() {
    const stripeKey = process.env.STRIPE_KEY
    if (!stripeKey) {
        console.error('❌ Error: STRIPE_KEY environment variable is required.')
        process.exit(1)
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' })
    console.log('🔄 Starting Subscription Sync...')

    // 1. Fetch All Users
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (userError) {
        console.error(`❌ Error scanning users: ${userError.message}`)
        return
    }
    console.log(`   Scanning ${users.length} users...`)

    let updated = 0
    let skipped = 0

    for (const user of users) {
        // Only log if it's our target user to reduce noise
        if (user.email === 'aryamoy03@gmail.com') process.stdout.write(`   Processing ${user.email}... `)

        // 2. Find Stripe Customer
        let customerId = null
        try {
            const customers = await stripe.customers.list({ email: user.email, limit: 1 })
            if (customers.data.length > 0) {
                customerId = customers.data[0].id
            } else {
                const found = await stripe.customers.search({
                    query: `metadata['supabase_user_id']:'${user.id}'`,
                    limit: 1,
                }).catch(() => ({ data: [] }))
                if (found.data.length) customerId = found.data[0].id
            }
        } catch (e) {
            if (user.email === 'aryamoy03@gmail.com') console.log(`❌ Stripe Error: ${e.message}`)
            continue
        }

        if (!customerId) {
            if (user.email === 'aryamoy03@gmail.com') console.log(`No Customer found.`)
            skipped++
            continue
        }

        // 3. Get Active Subscriptions
        const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 })

        if (subs.data.length === 0) {
            if (user.email === 'aryamoy03@gmail.com') console.log(`Customer found (${customerId}) but NO active sub.`)
            skipped++
            continue
        }

        // 4. Determine Tier
        const subscription = subs.data[0]
        let productId = null
        try {
            const price = subscription.items.data[0].price
            productId = typeof price.product === 'string' ? price.product : price.product.id
        } catch { }

        let tier = 'free'
        if (productId === TEACHER_PRODUCT_ID) tier = 'teacher_premium'
        else if (productId === STUDENT_PRODUCT_ID) tier = 'student_premium'
        else tier = 'teacher_premium' // Default fallback

        if (user.email === 'aryamoy03@gmail.com') console.log(`✅ MATCH! Tier: ${tier}`)
        else if (updated % 5 === 0) process.stdout.write('.') // lightweight progress

        // 5. Update DB
        const { error: upsertError } = await supabase.from('subscriptions').upsert({
            user_id: user.id,
            tier: tier,
            status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        }, { onConflict: 'user_id' })

        if (upsertError && user.email === 'aryamoy03@gmail.com') {
            console.log(`❌ DB Update Failed: ${upsertError.message}`)
        } else {
            updated++
        }
    }

    console.log(`\n✅ Sync Complete. Updated: ${updated}`)
}

syncSubscriptions()
