-- Add grading_details column to assessment_responses table
-- This column will store the full AI grading breakdown, including criteria-specific feedback

ALTER TABLE public.assessment_responses 
ADD COLUMN IF NOT EXISTS grading_details JSONB DEFAULT '{}'::jsonb;
