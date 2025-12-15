import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const AUTHORIZED_EMAIL = "social@classpace.co";

// Brevo list IDs will be created/fetched dynamically
interface BrevoList {
  id: number;
  name: string;
}

const log = (message: string, data?: any) => {
  console.log(`[marketing-admin] ${message}`, data ? JSON.stringify(data) : "");
};

async function verifyAuthorizedUser(authHeader: string): Promise<{ authorized: boolean; userId?: string; email?: string }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    log("Auth verification failed", { error });
    return { authorized: false };
  }
  
  // Case-insensitive email comparison
  const isAuthorized = user.email?.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase();
  log("User verified", { email: user.email, isAuthorized });
  
  return { 
    authorized: isAuthorized, 
    userId: user.id,
    email: user.email 
  };
}

async function brevoRequest(endpoint: string, method: string = "GET", body?: any) {
  const response = await fetch(`https://api.brevo.com/v3${endpoint}`, {
    method,
    headers: {
      "api-key": BREVO_API_KEY!,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    log(`Brevo API error: ${endpoint}`, { status: response.status, error: errorText });
    throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function getOrCreateBrevoLists(): Promise<Record<string, number>> {
  const requiredLists = [
    "classpace-learners",
    "classpace-teachers", 
    "classpace-learn-plus",
    "classpace-teach-plus"
  ];
  
  const listIds: Record<string, number> = {};
  
  // Fetch existing lists
  const existingLists = await brevoRequest("/contacts/lists?limit=50");
  log("Existing Brevo lists", existingLists);
  
  for (const listName of requiredLists) {
    const existing = existingLists.lists?.find((l: BrevoList) => l.name === listName);
    
    if (existing) {
      listIds[listName] = existing.id;
      log(`Found existing list: ${listName}`, { id: existing.id });
    } else {
      // Create the list
      const newList = await brevoRequest("/contacts/lists", "POST", {
        name: listName,
        folderId: 1, // Default folder
      });
      listIds[listName] = newList.id;
      log(`Created new list: ${listName}`, { id: newList.id });
    }
  }
  
  return listIds;
}

async function syncUserToBrevo(user: any, listIds: Record<string, number>) {
  const listsToAdd: number[] = [];
  
  // Add to role-based list
  if (user.role === "learner") {
    listsToAdd.push(listIds["classpace-learners"]);
  } else if (user.role === "teacher") {
    listsToAdd.push(listIds["classpace-teachers"]);
  }
  
  // Add to premium lists if applicable
  if (user.subscription_tier === "learner_premium") {
    listsToAdd.push(listIds["classpace-learn-plus"]);
  } else if (user.subscription_tier === "teacher_premium") {
    listsToAdd.push(listIds["classpace-teach-plus"]);
  }
  
  if (!user.email || listsToAdd.length === 0) return;
  
  try {
    await brevoRequest("/contacts", "POST", {
      email: user.email,
      attributes: {
        FIRSTNAME: user.first_name || "",
        LASTNAME: user.last_name || "",
        ROLE: user.role || "",
        SUBSCRIPTION_TIER: user.subscription_tier || "free",
      },
      listIds: listsToAdd,
      updateEnabled: true,
    });
    log(`Synced user to Brevo: ${user.email}`, { lists: listsToAdd });
  } catch (error) {
    log(`Failed to sync user: ${user.email}`, { error });
  }
}

async function getAllUsers() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role, created_at");
  
  if (profilesError) {
    log("Error fetching profiles", { error: profilesError });
    throw profilesError;
  }
  
  const { data: subscriptions, error: subsError } = await supabase
    .from("subscriptions")
    .select("user_id, tier, status");
  
  if (subsError) {
    log("Error fetching subscriptions", { error: subsError });
    throw subsError;
  }
  
  // Merge profiles with subscription data
  const users = profiles.map(profile => {
    const subscription = subscriptions.find(s => s.user_id === profile.id);
    return {
      ...profile,
      subscription_tier: subscription?.tier || "free",
      subscription_status: subscription?.status || "active",
    };
  });
  
  log(`Fetched ${users.length} users`);
  return users;
}

async function sendEmail(to: string[], subject: string, htmlContent: string, listId?: number) {
  const payload: any = {
    sender: { email: "social@classpace.co", name: "Classpace" },
    subject,
    htmlContent,
  };
  
  if (listId) {
    // Send to entire list
    payload.to = [{ email: "social@classpace.co" }]; // Brevo requires at least one recipient
    payload.messageVersions = [{
      to: [{ email: "social@classpace.co" }],
      params: {},
    }];
    
    // Use campaign for list-based sending
    const campaign = await brevoRequest("/emailCampaigns", "POST", {
      name: `Campaign ${Date.now()}`,
      subject,
      sender: { email: "social@classpace.co", name: "Classpace" },
      htmlContent,
      recipients: { listIds: [listId] },
    });
    
    // Send the campaign immediately
    await brevoRequest(`/emailCampaigns/${campaign.id}/sendNow`, "POST");
    log("Campaign sent to list", { listId, campaignId: campaign.id });
    return { success: true, campaignId: campaign.id };
  } else {
    // Send to specific recipients
    payload.to = to.map(email => ({ email }));
    const result = await brevoRequest("/smtp/email", "POST", payload);
    log("Email sent", { to, messageId: result?.messageId });
    return { success: true, messageId: result?.messageId };
  }
}

async function getBrevoLists() {
  // Fetch lists with statistics to get subscriber counts
  const lists = await brevoRequest("/contacts/lists?limit=50&sort=desc");
  return (lists.lists || []).map((list: any) => ({
    id: list.id,
    name: list.name,
    totalSubscribers: list.uniqueSubscribers || list.totalSubscribers || 0,
  }));
}

async function createCustomList(name: string, userEmails: string[]) {
  // Create list
  const newList = await brevoRequest("/contacts/lists", "POST", {
    name,
    folderId: 1,
  });
  
  // First, ensure contacts exist in Brevo (create or update them)
  for (const email of userEmails) {
    try {
      await brevoRequest("/contacts", "POST", {
        email,
        listIds: [newList.id],
        updateEnabled: true, // Update if exists, create if not
      });
      log(`Added/updated contact for list: ${email}`);
    } catch (error: any) {
      log(`Failed to add contact ${email} to list`, { error: error.message });
    }
  }
  
  log("Created custom list", { name, id: newList.id, contacts: userEmails.length });
  return newList;
}

async function deleteList(listId: number) {
  await brevoRequest(`/contacts/lists/${listId}`, "DELETE");
  log("Deleted list", { listId });
}

async function getListContacts(listId: number) {
  const contacts = await brevoRequest(`/contacts/lists/${listId}/contacts?limit=500`);
  return contacts.contacts || [];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { authorized, email } = await verifyAuthorizedUser(authHeader);
    if (!authorized) {
      log("Unauthorized access attempt", { email });
      return new Response(JSON.stringify({ error: "Forbidden - Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();
    log(`Action requested: ${action}`, params);

    let result;

    switch (action) {
      case "get-users":
        result = await getAllUsers();
        break;

      case "setup-lists":
        result = await getOrCreateBrevoLists();
        break;

      case "sync-all-users":
        const users = await getAllUsers();
        const listIds = await getOrCreateBrevoLists();
        for (const user of users) {
          await syncUserToBrevo(user, listIds);
        }
        result = { synced: users.length, listIds };
        break;

      case "get-lists":
        result = await getBrevoLists();
        break;

      case "send-email":
        result = await sendEmail(params.to, params.subject, params.htmlContent, params.listId);
        break;

      case "create-custom-list":
        result = await createCustomList(params.name, params.userEmails);
        break;

      case "delete-list":
        await deleteList(params.listId);
        result = { success: true };
        break;

      case "get-list-contacts":
        result = await getListContacts(params.listId);
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    log("Error in handler", { error: error.message, stack: error.stack });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
