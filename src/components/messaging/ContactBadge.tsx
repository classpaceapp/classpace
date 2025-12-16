import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Crown, Sparkles } from 'lucide-react';

interface ContactBadgeProps {
  educatorId: string;
  educatorName: string;
  onContactClick: () => void;
  viewerRole?: string;
}

export const ContactBadge: React.FC<ContactBadgeProps> = ({
  educatorId,
  educatorName,
  onContactClick,
  viewerRole,
}) => {
  const [isTeachPlus, setIsTeachPlus] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTeachPlusStatus();
  }, [educatorId]);

  const checkTeachPlusStatus = async () => {
    try {
      // Use RPC function that has SECURITY DEFINER to bypass RLS
      const { data, error } = await supabase.rpc('is_teach_plus_educator', {
        _user_id: educatorId
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setIsTeachPlus(false);
      } else {
        setIsTeachPlus(data === true);
      }
    } catch (err) {
      console.error('Error:', err);
      setIsTeachPlus(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  // Only show for Teach+ educators
  if (!isTeachPlus) {
    return null;
  }

  // Only show contact button to learners
  const showContactButton = viewerRole === 'learner';

  return (
    <div className="space-y-3">
      {/* Teach+ Badge */}
      <div className="flex items-center gap-2">
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md px-3 py-1.5 text-sm font-medium">
          <Crown className="h-3.5 w-3.5 mr-1.5" />
          Teach+ Educator
        </Badge>
      </div>

      {/* Contact Button - Only for learners */}
      {showContactButton && (
        <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 rounded-xl border-2 border-teal-200 dark:border-teal-800 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-md shrink-0">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-teal-900 dark:text-teal-100 text-sm">
                Connect with {educatorName.split(' ')[0]}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send a message to ask questions or discuss learning opportunities
              </p>
              <Button
                onClick={onContactClick}
                size="sm"
                className="mt-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Contact Educator
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
