import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CareerApplication {
  name: string;
  email: string;
  division: string;
  coverNote: string;
  cvBase64: string;
  cvFilename: string;
}

const handler = async (req: Request): Promise<Response> => {
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
    const { name, email, division, coverNote, cvBase64, cvFilename }: CareerApplication = await req.json();

    console.log("Processing career application from:", email);

    const emailResponse = await resend.emails.send({
      from: "careers@classpace.co",
      to: ["careers@classpace.co"],
      subject: `Career Application: ${name} - ${division}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .field { margin-bottom: 20px; }
            .label { font-weight: 600; color: #667eea; margin-bottom: 5px; }
            .value { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
            .badge { display: inline-block; background: #667eea; color: white; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎯 New Career Application</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Applicant Name</div>
                <div class="value">${name}</div>
              </div>
              
              <div class="field">
                <div class="label">Email Address</div>
                <div class="value"><a href="mailto:${email}" style="color: #667eea;">${email}</a></div>
              </div>
              
              <div class="field">
                <div class="label">Division of Interest</div>
                <div class="value"><span class="badge">${division}</span></div>
              </div>
              
              ${coverNote ? `
                <div class="field">
                  <div class="label">Cover Note</div>
                  <div class="value">${coverNote}</div>
                </div>
              ` : ''}
              
              <div class="footer">
                <p>CV attached: <strong>${cvFilename}</strong></p>
                <p>This application was submitted through the Classpace careers page.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: cvFilename,
          content: cvBase64,
        }
      ],
    });

    console.log("Career application email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-career-application function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
