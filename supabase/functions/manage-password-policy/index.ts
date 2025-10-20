import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PasswordPolicyRequest {
  organisationId: string;
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecialChar?: boolean;
}

interface AuthUser {
  id: string;
  email: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'GET') {
      return handleGet(supabaseClient, req, user);
    } else if (req.method === 'POST' || req.method === 'PUT') {
      return handleUpdate(supabaseClient, req, user);
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in password policy management:', error);

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

async function handleGet(supabaseClient: any, req: Request, user: AuthUser) {
  const url = new URL(req.url);
  const organisationId = url.searchParams.get('organisationId');

  if (!organisationId) {
    return new Response(
      JSON.stringify({ error: 'Missing organisationId parameter' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const isAdmin = await verifyAdminRole(supabaseClient, user.id, organisationId);
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions. Only admins can view password policies.' }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const { data, error } = await supabaseClient
    .from('password_requirements')
    .select('*')
    .eq('organisation_id', organisationId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching password requirements:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch password requirements', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const response = data ? {
    id: data.id,
    organisationId: data.organisation_id,
    minLength: data.min_length,
    requireUppercase: data.require_uppercase,
    requireLowercase: data.require_lowercase,
    requireNumber: data.require_number,
    requireSpecialChar: data.require_special_char,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by
  } : {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true
  };

  return new Response(
    JSON.stringify(response),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleUpdate(supabaseClient: any, req: Request, user: AuthUser) {
  const body: PasswordPolicyRequest = await req.json();

  const { organisationId, minLength, requireUppercase, requireLowercase, requireNumber, requireSpecialChar } = body;

  if (!organisationId) {
    return new Response(
      JSON.stringify({ error: 'Missing organisationId' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const isAdmin = await verifyAdminRole(supabaseClient, user.id, organisationId);
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions. Only admins can modify password policies.' }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (minLength !== undefined && (minLength < 6 || minLength > 128)) {
    return new Response(
      JSON.stringify({ error: 'Password minimum length must be between 6 and 128 characters' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const atLeastOneEnabled =
    (requireUppercase !== false) ||
    (requireLowercase !== false) ||
    (requireNumber !== false) ||
    (requireSpecialChar !== false);

  if (!atLeastOneEnabled) {
    return new Response(
      JSON.stringify({ error: 'At least one character requirement must be enabled' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const { data: existing } = await supabaseClient
    .from('password_requirements')
    .select('id')
    .eq('organisation_id', organisationId)
    .maybeSingle();

  const updateData: any = {
    updated_by: user.id,
    updated_at: new Date().toISOString()
  };

  if (minLength !== undefined) updateData.min_length = minLength;
  if (requireUppercase !== undefined) updateData.require_uppercase = requireUppercase;
  if (requireLowercase !== undefined) updateData.require_lowercase = requireLowercase;
  if (requireNumber !== undefined) updateData.require_number = requireNumber;
  if (requireSpecialChar !== undefined) updateData.require_special_char = requireSpecialChar;

  let result;
  let error;

  if (existing) {
    const response = await supabaseClient
      .from('password_requirements')
      .update(updateData)
      .eq('organisation_id', organisationId)
      .select()
      .single();

    result = response.data;
    error = response.error;
  } else {
    const insertData = {
      organisation_id: organisationId,
      min_length: minLength ?? 8,
      require_uppercase: requireUppercase ?? true,
      require_lowercase: requireLowercase ?? true,
      require_number: requireNumber ?? true,
      require_special_char: requireSpecialChar ?? true,
      updated_by: user.id
    };

    const response = await supabaseClient
      .from('password_requirements')
      .insert([insertData])
      .select()
      .single();

    result = response.data;
    error = response.error;
  }

  if (error) {
    console.error('Error saving password requirements:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to save password requirements',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const response = {
    id: result.id,
    organisationId: result.organisation_id,
    minLength: result.min_length,
    requireUppercase: result.require_uppercase,
    requireLowercase: result.require_lowercase,
    requireNumber: result.require_number,
    requireSpecialChar: result.require_special_char,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    updatedBy: result.updated_by
  };

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Password policy updated successfully',
      data: response
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function verifyAdminRole(supabaseClient: any, userId: string, organisationId: string): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('organisation_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organisation_id', organisationId)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.role === 'super_admin' || data.role === 'user_admin';
}
