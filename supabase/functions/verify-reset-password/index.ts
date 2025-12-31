import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
    email: string;
    otp: string;
    newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { email, otp, newPassword }: RequestBody = await req.json();

        if (!email || !otp || !newPassword) {
            throw new Error("Missing required fields");
        }

        if (newPassword.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Verify OTP
        const { data: resets, error: fetchError } = await supabaseAdmin
            .from("password_resets")
            .select("*")
            .eq("email", email)
            .eq("otp", otp)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1);

        if (fetchError || !resets || resets.length === 0) {
            throw new Error("Invalid or expired reset code");
        }

        // 2. Find User ID
        // We definitely need the User ID to update the password.
        // We can't use 'updateUser' with email directly in the admin API generally, we need ID.
        // Wait, Accessing `auth.users` directly is restricted, but `auth.admin` has methods.
        // `supabaseAdmin.auth.admin.listUsers` can filter by email? No, not reliably in all versions.
        // BUT! `supabaseAdmin.rpc`. OR better: use `generateLink` type of logic?
        // Actually, `supabaseAdmin.auth.admin.updateUserById(uid, attributes)` requires UID.
        // Is there `updateUserByEmail`? No.
        // We have to find the UID.
        // Strategy: We can get the user by creating a dummy session? No.
        // Reliable Strategy for Admin: List users and filter. It's expensive but workable for single ops.
        // OR... we can trust the `profiles` table if we maintain it well (ID matches Auth ID).
        // Let's rely on `profiles` (public) which links to `auth.users`.
        // Wait, profiles usually doesn't have email.
        // This is the tricky part of Supabase Admin without direct DB access.
        // Let's assume we can use `supabaseAdmin.auth.admin.listUsers()`
        // We will assume the traffic is low enough we can fetch or we rely on a different trick.
        // Actually, we can use `supabaseAdmin.auth.admin.createUser` with existing email -> returns User object? No, errors.

        // BETTER: We can use `supabase.from('profiles').select('id').eq('email', email)` IF we add email to profiles?
        // We don't have email in profiles.

        // CORRECT APPROACH: `supabaseAdmin.auth.admin.listUsers()` does not support email filter in JS client args?
        // It DOES support a search query!
        // `listUsers({ page: 1, perPage: 1000 })` ??
        // Let's checking Supabase JS library docs memory... 
        // `listUsers()` returns a list.
        // The safest way is to simple iterate or use the search param if available.
        // Actually, we can just use `supabaseAdmin.auth.admin.inviteUserByEmail`? No.
        // How about `supabaseAdmin.auth.admin.getUserById`? need ID.

        // OK, we'll try to find the user via `supabaseAdmin.auth.admin.listUsers()`.
        // NOTE: This might be slow if there are 10k users.
        // ALTERNATIVE: Use a postgres function (RPC)!
        // `get_user_id_by_email(email)` running with `security definer`.
        // This is the most performant way.
        // But I cannot create RPC functions easily via File Write API unless I append to migrations.
        // I created a migration file earlier. I can APPEND a function to it?
        // No, I already wrote it. I can write ANOTHER migration file.

        // Let's write `20251228183500_get_user_id_func.sql`

        // TEMPORARY FALLBACK: We will assume we can get the ID via listUsers for now, assuming user base isn't massive.
        // Wait, Classpace seems to be a real app.
        // I will write a helper RPC function in a new migration to be safe/performant.

        // Let's pause writing this file and write the RPC migration first.
        // Then come back.

        // Actually, I'll proceed with writing this file assuming the RPC exists, and then write the RPC migration immediately after.
        // RPC Name: `get_user_id_by_email`

        const { data: userIdData, error: rpcError } = await supabaseAdmin
            .rpc('get_user_id_by_email', { email_input: email });

        if (rpcError || !userIdData) {
            console.error("RPC Error:", rpcError);
            throw new Error("User not found (RPC failed)");
        }

        const userId = userIdData; // The RPC should return a UUID string or null

        if (!userId) {
            throw new Error("User not found");
        }

        // 3. Update Password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (updateError) {
            throw updateError;
        }

        // 4. Cleanup used OTP
        await supabaseAdmin
            .from("password_resets")
            .delete()
            .eq("email", email);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
};

serve(handler);
