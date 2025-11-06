import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Check } from 'lucide-react';

interface UpgradeOverlayProps {
  title: string;
  features: string[];
}

export const UpgradeOverlay: React.FC<UpgradeOverlayProps> = ({ title, features }) => {
  const navigate = useNavigate();

  return (
    <Card className="border-2 shadow-xl bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950/50 dark:via-fuchsia-950/50 dark:to-pink-950/50">
      <CardContent className="p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-3">
            {title}
          </h2>
          <p className="text-base text-foreground/70 font-medium">
            Upgrade to Teach+ to unlock this powerful feature
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-foreground/60 font-semibold text-center text-sm mb-4">
            This feature enables you to:
          </p>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-3 rounded-lg border border-purple-200/30">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md mt-0.5">
                  <Check className="h-3 w-3 text-white font-bold" />
                </div>
                <span className="text-foreground text-sm font-medium leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={() => navigate('/my-plan')}
          className="w-full py-5 text-base font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 text-white shadow-lg rounded-xl"
        >
          <Crown className="mr-2 h-5 w-5" />
          Upgrade to Teach+ for $7/month
        </Button>

        <p className="text-center text-xs text-foreground/50 mt-3">
          Unlock unlimited pods, Nexus AI tools, and more
        </p>
      </CardContent>
    </Card>
  );
};

export default UpgradeOverlay;
