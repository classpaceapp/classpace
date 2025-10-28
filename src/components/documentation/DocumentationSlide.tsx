import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface DocumentationSlideProps {
  icon: LucideIcon;
  title: string;
  description: string;
  content: ReactNode;
  gradient: string;
}

export const DocumentationSlide = ({ 
  icon: Icon, 
  title, 
  description, 
  content,
  gradient 
}: DocumentationSlideProps) => {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className={`max-w-4xl w-full border-2 shadow-2xl bg-gradient-to-br ${gradient}`}>
        <CardContent className="p-12 space-y-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl flex-shrink-0">
              <Icon className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {title}
              </h2>
              <p className="text-xl text-muted-foreground">{description}</p>
            </div>
          </div>
          
          <div className="space-y-6 text-foreground/90 text-lg leading-relaxed">
            {content}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
