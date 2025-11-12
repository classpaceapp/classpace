import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  text: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  // Split text by LaTeX delimiters and HTML tags, then render appropriately
  const renderWithMathAndFormatting = (input: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // Match LaTeX delimiters and HTML underline tags
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$|\\\\[\[\(][\s\S]*?\\\\[\]\)]|<u>[\s\S]*?<\/u>)/g;
    let match;
    
    while ((match = regex.exec(input)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(input.substring(currentIndex, match.index));
      }
      
      const matchContent = match[0];
      
      // Handle underline tags
      if (matchContent.startsWith('<u>') && matchContent.endsWith('</u>')) {
        const underlinedText = matchContent.slice(3, -4);
        parts.push(
          <u key={match.index} className="decoration-2 underline-offset-2">
            {underlinedText}
          </u>
        );
      } else {
        // Handle LaTeX
        let latex = matchContent;
        let isBlock = false;
        
        // Determine type and extract content
        if (matchContent.startsWith('$$') && matchContent.endsWith('$$')) {
          latex = matchContent.slice(2, -2);
          isBlock = true;
        } else if (matchContent.startsWith('$') && matchContent.endsWith('$')) {
          latex = matchContent.slice(1, -1);
        } else if (matchContent.startsWith('\\[') && matchContent.endsWith('\\]')) {
          latex = matchContent.slice(2, -2);
          isBlock = true;
        } else if (matchContent.startsWith('\\(') && matchContent.endsWith('\\)')) {
          latex = matchContent.slice(2, -2);
        }
        
        try {
          parts.push(
            isBlock ? (
              <BlockMath key={match.index} math={latex} />
            ) : (
              <InlineMath key={match.index} math={latex} />
            )
          );
        } catch (e) {
          // If LaTeX parsing fails, show original text
          parts.push(matchContent);
        }
      }
      
      currentIndex = match.index + matchContent.length;
    }
    
    // Add remaining text
    if (currentIndex < input.length) {
      parts.push(input.substring(currentIndex));
    }
    
    return parts.length > 0 ? parts : input;
  };
  
  return <span className={className}>{renderWithMathAndFormatting(text)}</span>;
};
