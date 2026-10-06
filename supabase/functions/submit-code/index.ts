/**
 * Supabase Edge Function: submit-code (Phase 5)
 *
 * Secure serverless endpoint for processing code submissions via Judge0.
 * Can be deployed with: supabase functions deploy submit-code
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  cpp: 54,
  c: 50,
  java: 62,
  javascript: 93,
  typescript: 94,
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'INVALID_SESSION' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sourceCode, language, problemId } = await req.json();

    if (!sourceCode || !language || !problemId) {
      return new Response(JSON.stringify({ error: 'MISSING_FIELDS' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const judge0Id = JUDGE0_LANGUAGE_IDS[language];
    if (!judge0Id) {
      return new Response(JSON.stringify({ error: 'UNSUPPORTED_LANGUAGE' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Retrieve problem and test cases
    const { data: problem } = await supabase.from('problems').select('id, status').eq('id', problemId).single();
    if (!problem || problem.status !== 'published') {
      return new Response(JSON.stringify({ error: 'PROBLEM_NOT_ACCESSIBLE' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch test cases
    const { data: testCases } = await supabase.from('test_cases').select('*').eq('problem_id', problemId);

    // Initial submission record
    const { data: subRecord } = await supabase.from('submissions').insert({
      problem_id: problemId,
      user_id: user.id,
      language,
      source_ref: 'edge_function',
      status: 'pending',
      score: 0,
    }).select('id').single();

    // Call Judge0
    const judgeUrl = Deno.env.get('JUDGE0_URL') || 'https://ce.judge0.com';
    const judgeRes = await fetch(`${judgeUrl}/submissions?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: btoa(sourceCode),
        language_id: judge0Id,
      }),
    });

    const judgeData = await judgeRes.json();
    const verdict = judgeData.status?.id === 3 ? 'accepted' : 'wrong_answer';

    return new Response(
      JSON.stringify({
        submissionId: subRecord?.id,
        verdict,
        judgeStatus: judgeData.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
