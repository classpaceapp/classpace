
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Configuration
const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZnlrY25pY2pkZmJzaWJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

// Product IDs
const TEACHER_PRODUCT_ID = 'prod_TJeHNIEXymOooF'
const STUDENT_PRODUCT_ID = 'prod_TK2C5qgNV85Jlc'

async function syncSubscriptions() {
    const stripeKey = process.env.STRIPE_KEY
    if (!stripeKey) {
        console.error('❌ Error: STRIPE_KEY required.')
        process.exit(1)
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' })
    console.log('🔄 Starting Subscription Sync...')

    // 1. Fetch Users
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (userError) {
        console.error(`❌ Error scanning users: ${userError.message}`)
        return
    }

    let updated = 0

    for (const user of users) {
        if (user.email === 'aryamoy03@gmail.com') process.stdout.write(`   Processing ${user.email}... `)

        // 2. Find Customer
        let customerId = null
        try {
            const customers = await stripe.customers.list({ email: user.email, limit: 1 })
            if (customers.data.length > 0) customerId = customers.data[0].id
            else {
                const found = await stripe.customers.search({
                    query: `metadata['supabase_user_id']:'${user.id}'`,
                    limit: 1,
                }).catch(() => ({ data: [] }))
                if (found.data.length) customerId = found.data[0].id
            }
        } catch (e) { continue }

        if (!customerId) continue

        // 3. Get Subscriptions
        const subs = await stripe.subscriptions.list({ customer: customerId, limit: 5 })

        // allow trialing
        const validSubs = subs.data.filter(s => ['active', 'trialing'].includes(s.status))

        if (validSubs.length === 0) continue

        const subscription = validSubs[0]

        // 4. Product Logic
        let productId = null
        try {
            const price = subscription.items.data[0].price
            productId = typeof price.product === 'string' ? price.product : price.product.id
        } catch { }

        let tier = 'free'
        if (productId === TEACHER_PRODUCT_ID) tier = 'teacher_premium'
        else if (productId === STUDENT_PRODUCT_ID) tier = 'student_premium'
        else tier = 'teacher_premium'

        if (user.email === 'aryamoy03@gmail.com') console.log(`✅ MATCH! Tier: ${tier}`)

        // 5. Date Logic
        let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Default 30 days
        if (subscription.current_period_end) {
            periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
        } else if (subscription.cancel_at) {
            periodEnd = new Date(subscription.cancel_at * 1000).toISOString()
        }

        // 6. Update
        await supabase.from('subscriptions').upsert({
            user_id: user.id,
            tier: tier,
            status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            current_period_end: periodEnd
        }, { onConflict: 'user_id' })

        updated++
    }
    console.log(`\n✅ Sync Complete. Records: ${updated}`)
}

syncSubscriptions()
