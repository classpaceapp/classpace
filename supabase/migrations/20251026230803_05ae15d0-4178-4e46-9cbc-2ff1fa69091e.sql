-- Create learning_chats table for storing student AI chat sessions
CREATE TABLE public.learning_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create learning_messages table for storing individual messages
CREATE TABLE public.learning_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.learning_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_chats
CREATE POLICY "Users can view their own learning chats"
ON public.learning_chats
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own learning chats"
ON public.learning_chats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning chats"
ON public.learning_chats
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning chats"
ON public.learning_chats
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for learning_messages
CREATE POLICY "Users can view messages from their own chats"
ON public.learning_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.learning_chats
    WHERE learning_chats.id = learning_messages.chat_id
    AND learning_chats.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their own chats"
ON public.learning_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.learning_chats
    WHERE learning_chats.id = learning_messages.chat_id
    AND learning_chats.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages from their own chats"
ON public.learning_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.learning_chats
    WHERE learning_chats.id = learning_messages.chat_id
    AND learning_chats.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_learning_chats_updated_at
BEFORE UPDATE ON public.learning_chats
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX idx_learning_chats_user_id ON public.learning_chats(user_id);
CREATE INDEX idx_learning_messages_chat_id ON public.learning_messages(chat_id);