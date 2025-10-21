// Classpace Database Types for Lovable Cloud

export interface Pod {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  teacher_id: string;
  pod_code: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  role: 'teacher' | 'learner';
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  pod_id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  ai_recap: string | null;
  created_at: string;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  user_id: string;
  message: string;
  is_pinned: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'free' | 'paid';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'cancelled' | 'expired';
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIAction {
  id: string;
  user_id: string;
  pod_id: string | null;
  action_type: 'recap' | 'quiz_generation' | 'project_suggestion' | 'contextual_qa';
  created_at: string;
}
