
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Configuration
const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

// Expected Product IDs from Code
const EXPECTED_TEACHER_ID = 'prod_TJeHNIEXymOooF'
const EXPECTED_STUDENT_ID = 'prod_TK2C5qgNV85Jlc'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

async function debugPremium() {
    const stripeKey = process.env.STRIPE_KEY
    if (!stripeKey) {
        console.error('❌ STRIPE_KEY required.')
        process.exit(1)
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' })

    const UUID = 'e3875412-fb9c-4297-88bf-7d92d3b17f2d'
    const EMAIL = 'aryamoy03@gmail.com'

    console.log(`\n🕵️ Deep Audit for User: ${EMAIL} (${UUID})`)
    console.log(`===================================================`)

    // 1. Check Supabase DB State
    const { data: subRow, error: dbError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', UUID)
        .single()

    console.log(`\n[1] Supabase DB 'subscriptions' table:`)
    if (dbError) console.log(`    ❌ Error/Missing: ${dbError.message}`)
    else {
        console.log(`    Status: ${subRow.status}`)
        console.log(`    Tier:   ${subRow.tier}`)
        console.log(`    Stripe Customer: ${subRow.stripe_customer_id}`)
    }

    // 2. Find Stripe Customer
    console.log(`\n[2] Stripe Customer Lookup:`)
    let customerId = subRow?.stripe_customer_id

    if (!customerId) {
        console.log(`    (Not in DB, searching by email...)`)
        const customers = await stripe.customers.list({ email: EMAIL, limit: 1 })
        if (customers.data.length) {
            customerId = customers.data[0].id
            console.log(`    ✅ Found by Email: ${customerId}`)
        } else {
            console.log(`    ❌ NO Customer found in Stripe for ${EMAIL}`)
            return
        }
    } else {
        console.log(`    Using ID from DB: ${customerId}`)
    }

    // 3. Check Active Subscriptions
    console.log(`\n[3] Active Stripe Subscriptions:`)
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active' })

    if (subs.data.length === 0) {
        console.log(`    ❌ User has NO 'active' subscriptions in Stripe.`)
        // Check for other statuses?
        const allSubs = await stripe.subscriptions.list({ customer: customerId, limit: 5 })
        console.log(`    (Total subs found: ${allSubs.data.length} - checking statuses...)`)
        allSubs.data.forEach(s => console.log(`     - ${s.id}: ${s.status}`))
        return
    }

    // 4. Analyze Products
    console.log(`    Found ${subs.data.length} active subscription(s). Analyzing Products...`)

    for (const s of subs.data) {
        const price = s.items.data[0].price
        const productId = typeof price.product === 'string' ? price.product : price.product.id

        console.log(`\n    ➡️  Subscription ${s.id}:`)
        console.log(`        Product ID: ${productId}`)

        let match = 'NONE'
        if (productId === EXPECTED_TEACHER_ID) match = 'TEACHER (Correct)'
        else if (productId === EXPECTED_STUDENT_ID) match = 'STUDENT (Correct)'

        console.log(`        Match Status: ${match}`)

        if (match === 'NONE') {
            console.log(`        ⚠️  MISMATCH! This product ID does NOT match the code.`)
            console.log(`            Code expects: ${EXPECTED_TEACHER_ID} OR ${EXPECTED_STUDENT_ID}`)

            // Fetch product name to be helpful
            try {
                const product = await stripe.products.retrieve(productId)
                console.log(`            Actual Product Name: ${product.name}`)
            } catch { }
        } else {
            console.log(`        ✅ This should be working.`)
        }
    }
}

debugPremium()
