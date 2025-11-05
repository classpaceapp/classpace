import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, FolderOpen } from 'lucide-react';

const ResourceCenter: React.FC = () => (
  <div className="space-y-6">
    {/* Header Card */}
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 shadow-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-orange-400/10 to-rose-400/10"></div>
      <CardContent className="p-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg">
            <FolderOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent mb-1">
              Resource Center
            </h3>
            <p className="text-muted-foreground text-sm">
              Access and manage your curated teaching resources library
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

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