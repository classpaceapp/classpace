import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, FolderOpen } from 'lucide-react';

const ResourceCenter: React.FC = () => (
  <div className="space-y-6">
    <Card className="border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 shadow-xl">
      <CardContent className="p-16 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Sparkles className="h-12 w-12 text-white" />
        </div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">Coming Soon</h3>
        <p className="text-lg text-muted-foreground">Curated teaching resources library</p>
      </CardContent>
    </Card>
  </div>
);

export default ResourceCenter;