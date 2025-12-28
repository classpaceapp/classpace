-- Create table for flashcard sets
CREATE TABLE IF NOT EXISTS public.pod_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  curriculum TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  card_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for individual flashcards
CREATE TABLE IF NOT EXISTS public.flashcard_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_set_id UUID NOT NULL REFERENCES public.pod_flashcards(id) ON DELETE CASCADE,
  hint TEXT NOT NULL,
  content TEXT NOT NULL,
  card_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pod_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pod_flashcards
CREATE POLICY "Pod members can view flashcards"
ON public.pod_flashcards
FOR SELECT
USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Pod members can create flashcards"
ON public.pod_flashcards
FOR INSERT
WITH CHECK (has_pod_access(auth.uid(), pod_id) AND auth.uid() = created_by);

CREATE POLICY "Creators can delete their flashcards"
ON public.pod_flashcards
FOR DELETE
USING (auth.uid() = created_by);

-- RLS Policies for flashcard_cards
CREATE POLICY "Users can view flashcard cards"
ON public.flashcard_cards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pod_flashcards pf
    WHERE pf.id = flashcard_cards.flashcard_set_id
    AND has_pod_access(auth.uid(), pf.pod_id)
  )
);

CREATE POLICY "Users can create flashcard cards"
ON public.flashcard_cards
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pod_flashcards pf
    WHERE pf.id = flashcard_cards.flashcard_set_id
    AND auth.uid() = pf.created_by
  )
);

-- Create indexes for performance
CREATE INDEX idx_pod_flashcards_pod_id ON public.pod_flashcards(pod_id);
CREATE INDEX idx_pod_flashcards_created_by ON public.pod_flashcards(created_by);
CREATE INDEX idx_flashcard_cards_set_id ON public.flashcard_cards(flashcard_set_id);
CREATE INDEX idx_flashcard_cards_order ON public.flashcard_cards(flashcard_set_id, card_order);