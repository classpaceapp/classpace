import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface TeachPlusBadgeProps {
  userId: string;
  size?: 'sm' | 'md';
}

export const TeachPlusBadge: React.FC<TeachPlusBadgeProps> = ({ userId, size = 'md' }) => {
  const [isTeachPlus, setIsTeachPlus] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    try {
      // Use RPC function that has SECURITY DEFINER to bypass RLS
      const { data, error } = await supabase.rpc('is_teach_plus_educator', {
        _user_id: userId
      });

      if (!error && data === true) {
        setIsTeachPlus(true);
      }
    } catch (err) {
      console.error('Error checking Teach+ status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isTeachPlus) {
    return null;
  }

  if (size === 'sm') {
    return (
      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm px-1.5 py-0.5 text-[10px] font-medium">
        <Crown className="h-2.5 w-2.5 mr-0.5" />
        Teach+
      </Badge>
    );
  }

  return (
    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md px-2.5 py-1 text-xs font-medium">
      <Crown className="h-3 w-3 mr-1" />
      Teach+
    </Badge>
  );
};
