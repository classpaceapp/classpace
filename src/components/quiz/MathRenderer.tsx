import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  text: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  // Split text by LaTeX delimiters and render appropriately
  const renderWithMath = (input: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // Match both inline $...$ and display $$...$$ and also \\(...\\) and \\[...\\]
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$|\\\\[\[\(][\s\S]*?\\\\[\]\)])/g;
    let match;
    
    while ((match = regex.exec(input)) !== null) {
      // Add text before the math
      if (match.index > currentIndex) {
        parts.push(input.substring(currentIndex, match.index));
      }
      
      const mathContent = match[0];
      let latex = mathContent;
      let isBlock = false;
      
      // Determine type and extract content
      if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
        latex = mathContent.slice(2, -2);
        isBlock = true;
      } else if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
        latex = mathContent.slice(1, -1);
      } else if (mathContent.startsWith('\\[') && mathContent.endsWith('\\]')) {
        latex = mathContent.slice(2, -2);
        isBlock = true;
      } else if (mathContent.startsWith('\\(') && mathContent.endsWith('\\)')) {
        latex = mathContent.slice(2, -2);
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
        parts.push(mathContent);
      }
      
      currentIndex = match.index + mathContent.length;
    }
    
    // Add remaining text
    if (currentIndex < input.length) {
      parts.push(input.substring(currentIndex));
    }
    
    return parts.length > 0 ? parts : input;
  };
  
  return <span className={className}>{renderWithMath(text)}</span>;
};
