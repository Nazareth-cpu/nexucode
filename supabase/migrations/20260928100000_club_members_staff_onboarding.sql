-- ============================================================================
-- Migration: 20260928100000_club_members_staff_onboarding.sql
-- Project: Nexus Code — Contest & Event Platform
-- Feature: Club Member Identity & Staff Onboarding
-- ============================================================================
--
-- Requirements:
-- 1. club_members table storing:
--    - unique member_id
--    - assigned role: EVENT_COORDINATOR or ADMIN
--    - status: PENDING / ACTIVE / DISABLED
--    - linked auth user ID
--    - activation token hash (never raw token)
--    - claimed_at / created_at timestamps
-- 2. Prevents token reuse, duplicate member IDs, and client-side privilege escalation.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  assigned_role TEXT NOT NULL CHECK (assigned_role IN ('coordinator', 'admin', 'EVENT_COORDINATOR', 'ADMIN')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'DISABLED')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
  token_hash TEXT,
  expires_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS Policies on club_members:
-- Only Platform Administrators can view, create, or update staff invitations.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "club_members_admin_select" ON public.club_members;
CREATE POLICY "club_members_admin_select" ON public.club_members
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "club_members_admin_insert" ON public.club_members;
CREATE POLICY "club_members_admin_insert" ON public.club_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS "club_members_admin_update" ON public.club_members;
CREATE POLICY "club_members_admin_update" ON public.club_members
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS "club_members_admin_delete" ON public.club_members;
CREATE POLICY "club_members_admin_delete" ON public.club_members
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- Automatic updated_at trigger
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_set_club_members_updated_at ON public.club_members;
CREATE TRIGGER tr_set_club_members_updated_at
  BEFORE UPDATE ON public.club_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Stored Procedure: claim_staff_activation
-- Atomic, secure claim workflow.
-- Validates token hash, assigns authoritative role to profile, invalidates token hash permanently.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_staff_activation(
  p_member_id TEXT,
  p_token_hash TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_normalized_role TEXT;
BEGIN
  -- Lock the club_members row
  SELECT * INTO v_member
  FROM public.club_members
  WHERE member_id = p_member_id
    AND status = 'PENDING'
    AND token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid, expired, or already claimed activation token.';
  END IF;

  IF v_member.expires_at IS NOT NULL AND v_member.expires_at < now() THEN
    RAISE EXCEPTION 'This activation token has expired.';
  END IF;

  -- Normalize role: EVENT_COORDINATOR -> coordinator, ADMIN -> admin
  IF v_member.assigned_role IN ('admin', 'ADMIN') THEN
    v_normalized_role := 'admin';
  ELSE
    v_normalized_role := 'coordinator';
  END IF;

  -- Ensure user is not already linked to another member record
  IF EXISTS (
    SELECT 1 FROM public.club_members
    WHERE user_id = p_user_id
      AND member_id <> p_member_id
  ) THEN
    RAISE EXCEPTION 'This user account is already linked to another staff membership record.';
  END IF;

  -- Update target profile role authoritatively
  UPDATE public.profiles
  SET role = v_normalized_role,
      updated_at = now()
  WHERE id = p_user_id;

  -- Mark club_member record ACTIVE, link user_id, record claimed_at, and PERMANENTLY NULL OUT token_hash
  UPDATE public.club_members
  SET status = 'ACTIVE',
      user_id = p_user_id,
      claimed_at = now(),
      token_hash = NULL,
      updated_at = now()
  WHERE id = v_member.id;

  RETURN jsonb_build_object(
    'success', true,
    'memberId', p_member_id,
    'assignedRole', v_normalized_role,
    'userId', p_user_id
  );
END;
$$;
