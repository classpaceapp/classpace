import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Search, Star, Download, Eye, FileText, Video, Image } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ResourceCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const resources = [
    {
      id: 1,
      title: 'Quadratic Equations Lesson Plan',
      type: 'lesson',
      subject: 'Mathematics',
      grade: '9-10',
      rating: 4.8,
      downloads: 245,
      icon: FileText,
      description: 'Comprehensive lesson plan with activities'
    },
    {
      id: 2,
      title: 'Graphing Tutorial Video',
      type: 'video',
      subject: 'Mathematics',
      grade: '9-10',
      rating: 4.9,
      downloads: 189,
      icon: Video,
      description: 'Step-by-step graphing instruction'
    },
    {
      id: 3,
      title: 'Function Transformation Slides',
      type: 'presentation',
      subject: 'Mathematics',
      grade: '11-12',
      rating: 4.7,
      downloads: 312,
      icon: Image,
      description: 'Visual presentation with examples'
    }
  ];

  const categories = [
    { name: 'Lesson Plans', count: 156, color: 'bg-violet-100 text-violet-700' },
    { name: 'Worksheets', count: 243, color: 'bg-blue-100 text-blue-700' },
    { name: 'Videos', count: 89, color: 'bg-green-100 text-green-700' },
    { name: 'Presentations', count: 127, color: 'bg-orange-100 text-orange-700' }
  ];

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-violet-600" />
            Resource Library
          </CardTitle>
          <CardDescription>
            Access curated teaching materials and community resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for resources, topics, or materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((category, idx) => (
              <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${category.color} mb-2`}>
                    <span className="text-2xl font-bold">{category.count}</span>
                  </div>
                  <p className="font-semibold text-sm">{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Featured Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Featured Resources
          </CardTitle>
          <CardDescription>
            Top-rated materials curated for your subjects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <Card key={resource.id} className="border-l-4 border-l-violet-500">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-violet-100 rounded-lg">
                      <Icon className="h-6 w-6 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {resource.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-semibold">{resource.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline">{resource.subject}</Badge>
                        <Badge variant="outline">Grade {resource.grade}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {resource.downloads} downloads
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm" className="flex-1 bg-violet-500 hover:bg-violet-600">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceCenter;