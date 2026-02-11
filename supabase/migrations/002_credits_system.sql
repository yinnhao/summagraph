-- ============================================
-- SummaGraph Credits System Migration
-- Adds credits-based usage tracking
-- ============================================

-- 1. Add credits column to profiles (default 10 for new users)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits int DEFAULT 10;

-- 2. Set credits=10 for existing users who don't have credits set
UPDATE public.profiles SET credits = 10 WHERE credits IS NULL;

-- 3. Update the handle_new_user trigger to include credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, credits)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    10  -- 10 free credits for new users (2 generations)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Helper function: deduct credits atomically (returns remaining credits, -1 if insufficient)
CREATE OR REPLACE FUNCTION public.deduct_credits(user_id_input uuid, amount int)
RETURNS int AS $$
DECLARE
  current_credits int;
BEGIN
  -- Lock the row and check credits
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = user_id_input
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RETURN -1;
  END IF;

  IF current_credits < amount THEN
    RETURN -1;  -- Insufficient credits
  END IF;

  -- Deduct credits
  UPDATE public.profiles
  SET credits = credits - amount, updated_at = now()
  WHERE id = user_id_input;

  RETURN current_credits - amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Helper function: add credits
CREATE OR REPLACE FUNCTION public.add_credits(user_id_input uuid, amount int)
RETURNS int AS $$
DECLARE
  new_credits int;
BEGIN
  UPDATE public.profiles
  SET credits = credits + amount, updated_at = now()
  WHERE id = user_id_input
  RETURNING credits INTO new_credits;

  RETURN COALESCE(new_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
