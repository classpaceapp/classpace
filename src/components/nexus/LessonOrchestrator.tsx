import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const LessonOrchestrator: React.FC = () => (
  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <CardContent className="p-16 text-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6">
        <Calendar className="h-12 w-12 text-white" />
      </div>
      <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">Coming Soon</h3>
      <p className="text-lg text-muted-foreground">Intelligent lesson planning and orchestration</p>
    </CardContent>
  </Card>
);

export default LessonOrchestrator;
