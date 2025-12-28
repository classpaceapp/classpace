
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const PROJECT_URL = 'https://ihfykcnicjdfbsibgcgn.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjQxMywiZXhwIjoyMDgyMzE4NDEzfQ._bNCb8Xa5QSlbG8PBX5ZpTPmuwo5T4yIi8gfw9l58vw'

const supabase = createClient(PROJECT_URL, SERVICE_KEY)

async function debugSimple() {
    const stripeKey = process.env.STRIPE_KEY
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' })
    const EMAIL = 'aryamoy03@gmail.com'

    console.log("START_DEBUG")

    // 1. Get Customer
    const customers = await stripe.customers.list({ email: EMAIL, limit: 1 })
    if (!customers.data.length) {
        console.log("NO_CUSTOMER")
        return
    }
    const customerId = customers.data[0].id
    console.log(`CUSTOMER_ID: ${customerId}`)

    // 2. Get Subs
    const subs = await stripe.subscriptions.list({ customer: customerId, limit: 5 })
    console.log(`TOTAL_SUBS: ${subs.data.length}`)

    subs.data.forEach(s => {
        const price = s.items.data[0].price
        const productId = typeof price.product === 'string' ? price.product : price.product.id
        console.log(`SUB_ID: ${s.id}`)
        console.log(`STATUS: ${s.status}`)
        console.log(`PRODUCT_ID: ${productId}`)
        // Print plan name if possible
        console.log(`PRICE_ID: ${price.id}`)
    })

    console.log("END_DEBUG")
}

debugSimple()
