// Deno Edge Function to seed test users (teacher and student)
// Endpoint: POST /functions/v1/seed_test_users
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Hardcoded test users
  const users = [
    {
      email: "teacher@classpace.test",
      password: "Password123!",
      role: "teacher" as const,
      first_name: "Test",
      last_name: "Teacher",
    },
    {
      email: "student@classpace.test",
      password: "Password123!",
      role: "learner" as const,
      first_name: "Test",
      last_name: "Student",
    },
  ];

  async function findUserIdByEmail(email: string): Promise<string | null> {
    // Fallback: paginate through users to find by email (small project scale)
    let page = 1;
    const perPage = 200;
    for (let i = 0; i < 10; i++) { // up to 2000 users scan
      const { data, error } = await (supabase as any).auth.admin.listUsers({ page, perPage });
      if (error) break;
      const match = data?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (match) return match.id as string;
      if (!data || data.users.length < perPage) break;
      page++;
    }
    return null;
  }

  const results: Array<{ email: string; id: string }> = [];

  for (const u of users) {
    let userId: string | null = null;

    // Try to create user
    const { data: created, error: createErr } = await (supabase as any).auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        role: u.role,
        first_name: u.first_name,
        last_name: u.last_name,
      },
    });

    if (createErr) {
      // If already exists, locate ID
      userId = await findUserIdByEmail(u.email);
      if (!userId) {
        return new Response(
          JSON.stringify({ error: `Failed to create or find user ${u.email}`, details: createErr?.message || createErr }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      userId = created.user?.id ?? null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: `Missing user ID for ${u.email}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Upsert profile to ensure role and names exist
    const { error: upsertErr } = await supabase.from("profiles").upsert(
      [
        {
          id: userId,
          role: u.role,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
        },
      ],
      { onConflict: "id" }
    );

    if (upsertErr) {
      return new Response(
        JSON.stringify({ error: `Failed to upsert profile for ${u.email}`, details: upsertErr.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    results.push({ email: u.email, id: userId });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: "Test users are ready.",
      credentials: {
        teacher: { email: users[0].email, password: users[0].password },
        student: { email: users[1].email, password: users[1].password },
      },
      users: results,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
