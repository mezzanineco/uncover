import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InviteEmailRequest {
  inviteId: string;
  email: string;
  inviteType: 'organization' | 'assessment';
  organizationName: string;
  inviterName?: string;
  assessmentName?: string;
  inviteUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      inviteId,
      email,
      inviteType,
      organizationName,
      inviterName = 'Someone',
      assessmentName,
      inviteUrl,
    }: InviteEmailRequest = await req.json();

    if (!inviteId || !email || !inviteType || !organizationName || !inviteUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured',
          inviteId,
          message: 'Invite created but email not sent. Please configure RESEND_API_KEY.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build email content based on invite type
    const subject = inviteType === 'assessment'
      ? `You're invited to complete "${assessmentName}" by ${organizationName}`
      : `You're invited to join ${organizationName}`;

    const htmlContent = buildEmailHtml({
      inviteType,
      organizationName,
      inviterName,
      assessmentName,
      inviteUrl,
    });

    const textContent = buildEmailText({
      inviteType,
      organizationName,
      inviterName,
      assessmentName,
      inviteUrl,
    });

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Archetype Finder <onboarding@resend.dev>',
        to: [email],
        subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email',
          details: errorData,
          inviteId 
        }),
        {
          status: emailResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        inviteId,
        emailId: emailData.id,
        message: 'Invite email sent successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending invite email:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildEmailHtml(params: {
  inviteType: string;
  organizationName: string;
  inviterName: string;
  assessmentName?: string;
  inviteUrl: string;
}): string {
  const { inviteType, organizationName, inviterName, assessmentName, inviteUrl } = params;

  if (inviteType === 'assessment') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Invite</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">You're Invited! 🎯</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                Hi there,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                <strong>${inviterName}</strong> from <strong>${organizationName}</strong> has invited you to complete the brand archetype assessment:
              </p>
              <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0;">${assessmentName}</p>
              </div>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 30px;">
                Discover your brand archetype and unlock insights about your unique personality and strengths. The assessment takes about 10-15 minutes to complete.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                      Start Assessment →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 24px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                This invitation will expire in 7 days. If you have any questions, please contact the person who invited you.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} Archetype Finder. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Organization Invite</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">Join Our Team! 🚀</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                Hi there,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Archetype Finder.
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 30px;">
                Accept this invitation to collaborate on brand archetype assessments, view team results, and unlock powerful insights together.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
                      Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 24px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} Archetype Finder. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

function buildEmailText(params: {
  inviteType: string;
  organizationName: string;
  inviterName: string;
  assessmentName?: string;
  inviteUrl: string;
}): string {
  const { inviteType, organizationName, inviterName, assessmentName, inviteUrl } = params;

  if (inviteType === 'assessment') {
    return `
You're Invited!

Hi there,

${inviterName} from ${organizationName} has invited you to complete the brand archetype assessment: "${assessmentName}"

Discover your brand archetype and unlock insights about your unique personality and strengths. The assessment takes about 10-15 minutes to complete.

Start Assessment: ${inviteUrl}

This invitation will expire in 7 days. If you have any questions, please contact the person who invited you.

© ${new Date().getFullYear()} Archetype Finder. All rights reserved.
    `.trim();
  } else {
    return `
Join Our Team!

Hi there,

${inviterName} has invited you to join ${organizationName} on Archetype Finder.

Accept this invitation to collaborate on brand archetype assessments, view team results, and unlock powerful insights together.

Accept Invitation: ${inviteUrl}

This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Archetype Finder. All rights reserved.
    `.trim();
  }
}
