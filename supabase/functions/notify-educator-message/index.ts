import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type?: 'new_message' | 'reply';
  educatorId?: string;
  learnerId: string;
  subject: string;
  messagePreview?: string;
  replyPreview?: string;
  messageId?: string;
}

const getNewMessageEmailHtml = (
  educatorName: string,
  learnerName: string,
  subject: string,
  messagePreview: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                📬 New Message Received
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="color: #334155; font-size: 18px; margin: 0 0 24px 0;">
                Hi <strong>${educatorName}</strong>,
              </p>
              
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                You have received a new message from a student on Classpace!
              </p>
              
              <!-- Message Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0fdfa; border-radius: 12px; border: 1px solid #99f6e4; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #0d9488; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
                      From
                    </p>
                    <p style="color: #134e4a; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
                      ${learnerName}
                    </p>
                    
                    <p style="color: #0d9488; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
                      Subject
                    </p>
                    <p style="color: #134e4a; font-size: 16px; font-weight: 500; margin: 0 0 16px 0;">
                      ${subject}
                    </p>
                    
                    <p style="color: #0d9488; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
                      Message Preview
                    </p>
                    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">
                      "${messagePreview}${messagePreview.length >= 200 ? '...' : ''}"
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://classpace.co/dashboard" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px 0 rgba(20, 184, 166, 0.4);">
                      Reply in Classpace →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 32px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">
                This notification was sent because you're a Teach+ educator on Classpace.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2025 Classpace Inc. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getReplyEmailHtml = (
  learnerName: string,
  educatorName: string,
  subject: string,
  replyPreview: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ✨ Educator Response
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="color: #334155; font-size: 18px; margin: 0 0 24px 0;">
                Hi <strong>${learnerName}</strong>,
              </p>
              
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Great news! <strong>${educatorName}</strong> has replied to your message on Classpace.
              </p>
              
              <!-- Reply Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf5ff; border-radius: 12px; border: 1px solid #e9d5ff; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #7c3aed; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
                      Re: ${subject}
                    </p>
                    
                    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">
                      "${replyPreview}${replyPreview.length >= 200 ? '...' : ''}"
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://classpace.co/messages" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);">
                      View Full Reply →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 32px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">
                Keep learning and growing with Classpace!
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2025 Classpace Inc. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: NotificationRequest = await req.json();
    const { type = 'new_message', educatorId, learnerId, subject, messagePreview, replyPreview } = body;

    console.log('[NOTIFY-EDUCATOR] Processing notification:', { type, educatorId, learnerId, subject });

    if (type === 'new_message' && educatorId) {
      // Fetch educator profile and email
      const { data: educatorProfile, error: educatorError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', educatorId)
        .single();

      if (educatorError || !educatorProfile?.email) {
        console.error('[NOTIFY-EDUCATOR] Failed to fetch educator:', educatorError);
        throw new Error('Educator not found or no email');
      }

      // Fetch learner name
      const { data: learnerProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', learnerId)
        .single();

      const educatorName = `${educatorProfile.first_name || ''} ${educatorProfile.last_name || ''}`.trim() || 'Educator';
      const learnerName = `${learnerProfile?.first_name || ''} ${learnerProfile?.last_name || ''}`.trim() || 'A Student';

      console.log('[NOTIFY-EDUCATOR] Sending email to educator:', educatorProfile.email);

      const emailResponse = await resend.emails.send({
        from: "Classpace <social@classpace.co>",
        to: [educatorProfile.email],
        subject: `📬 New message from ${learnerName}: ${subject}`,
        html: getNewMessageEmailHtml(educatorName, learnerName, subject, messagePreview || ''),
      });

      console.log('[NOTIFY-EDUCATOR] Email sent:', emailResponse);

    } else if (type === 'reply') {
      // Fetch learner profile and email
      const { data: learnerProfile, error: learnerError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', learnerId)
        .single();

      if (learnerError || !learnerProfile?.email) {
        console.error('[NOTIFY-EDUCATOR] Failed to fetch learner:', learnerError);
        throw new Error('Learner not found or no email');
      }

      // Fetch educator name
      const { data: educatorProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', educatorId)
        .single();

      const learnerName = `${learnerProfile.first_name || ''} ${learnerProfile.last_name || ''}`.trim() || 'Student';
      const educatorName = `${educatorProfile?.first_name || ''} ${educatorProfile?.last_name || ''}`.trim() || 'An Educator';

      console.log('[NOTIFY-EDUCATOR] Sending reply notification to learner:', learnerProfile.email);

      const emailResponse = await resend.emails.send({
        from: "Classpace <social@classpace.co>",
        to: [learnerProfile.email],
        subject: `✨ ${educatorName} replied to your message`,
        html: getReplyEmailHtml(learnerName, educatorName, subject, replyPreview || ''),
      });

      console.log('[NOTIFY-EDUCATOR] Reply notification sent:', emailResponse);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('[NOTIFY-EDUCATOR] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
