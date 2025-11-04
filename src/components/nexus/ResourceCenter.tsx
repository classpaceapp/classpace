import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

const ResourceCenter: React.FC = () => (
  <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
    <CardContent className="p-16 text-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
        <Sparkles className="h-12 w-12 text-white" />
      </div>
      <h3 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-3">Coming Soon</h3>
      <p className="text-lg text-muted-foreground">Curated teaching resources library</p>
    </CardContent>
  </Card>
);

export default ResourceCenter;