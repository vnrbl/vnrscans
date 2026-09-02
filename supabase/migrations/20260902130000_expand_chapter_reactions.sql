-- Migration: Expand allowed reaction types on chapter_reactions
-- Allows flexible chapter meme & community reactions up to 32 chars
ALTER TABLE public.chapter_reactions DROP CONSTRAINT IF EXISTS chapter_reactions_reaction_type_check;

ALTER TABLE public.chapter_reactions ADD CONSTRAINT chapter_reactions_reaction_type_check 
  CHECK (length(reaction_type) > 0 AND length(reaction_type) <= 32);
