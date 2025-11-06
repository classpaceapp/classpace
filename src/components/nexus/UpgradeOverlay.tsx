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
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-fuchsia-900/95 to-pink-900/95 backdrop-blur-xl z-10 rounded-3xl border-4 border-amber-400/50 shadow-2xl flex items-center justify-center p-8">
        <Card className="w-full max-w-2xl border-0 shadow-2xl bg-gradient-to-br from-white/95 to-purple-50/95">
          <CardContent className="p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-pink-600 flex items-center justify-center shadow-2xl">
                <Crown className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-4">
                {title}
              </h2>
              <p className="text-lg text-foreground/80 font-medium">
                Upgrade to Teach+ to unlock this powerful feature
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-foreground/70 font-semibold text-center mb-6">
                This feature enables you to:
              </p>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200/50">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Check className="h-4 w-4 text-white font-bold" />
                    </div>
                    <span className="text-foreground font-medium leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => navigate('/my-plan')}
              className="w-full py-6 text-lg font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 text-white shadow-2xl rounded-2xl"
            >
              <Crown className="mr-3 h-6 w-6" />
              Upgrade to Teach+ for $7/month
            </Button>

            <p className="text-center text-sm text-foreground/60 mt-4">
              Unlock unlimited pods, Nexus AI tools, and more
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpgradeOverlay;
