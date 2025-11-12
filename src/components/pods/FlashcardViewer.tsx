import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, RotateCcw, X, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { jsPDF } from 'jspdf';

interface FlashcardCard {
  id: string;
  hint: string;
  content: string;
  card_order: number;
}

interface FlashcardSet {
  id: string;
  title: string;
  curriculum: string;
  topic: string;
  subtopic: string | null;
  card_count: number;
}

interface FlashcardViewerProps {
  flashcardSetId: string;
  onClose: () => void;
}

export const FlashcardViewer = ({ flashcardSetId, onClose }: FlashcardViewerProps) => {
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlashcards();
  }, [flashcardSetId]);

  const fetchFlashcards = async () => {
    try {
      // Fetch flashcard set
      const { data: setData, error: setError } = await supabase
        .from("pod_flashcards")
        .select("*")
        .eq("id", flashcardSetId)
        .single();

      if (setError) throw setError;
      setFlashcardSet(setData);

      // Fetch cards
      const { data: cardsData, error: cardsError } = await supabase
        .from("flashcard_cards")
        .select("*")
        .eq("flashcard_set_id", flashcardSetId)
        .order("card_order", { ascending: true });

      if (cardsError) throw cardsError;
      setCards(cardsData || []);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      toast.error("Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleDownloadPDF = async () => {
    if (cards.length === 0) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);

      // Loop through all cards
      cards.forEach((card, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        // Golden gradient background for front
        pdf.setFillColor(255, 223, 128);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Add decorative golden border
        pdf.setDrawColor(218, 165, 32);
        pdf.setLineWidth(2);
        pdf.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - (2 * margin) + 10, 'S');

        // Front of card - Question
        pdf.setFontSize(24);
        pdf.setTextColor(139, 69, 19);
        pdf.text('Question', pageWidth / 2, margin + 10, { align: 'center' });

        // Card number with golden badge
        pdf.setFillColor(255, 215, 0);
        pdf.roundedRect(pageWidth / 2 - 15, margin + 20, 30, 10, 3, 3, 'F');
        pdf.setFontSize(14);
        pdf.setTextColor(139, 69, 19);
        pdf.text(`Card ${card.card_order}`, pageWidth / 2, margin + 27, { align: 'center' });

        // Question content - convert LaTeX to readable format
        const readableHint = card.hint
          .replace(/\$\$(.+?)\$\$/g, '[$1]')
          .replace(/\$(.+?)\$/g, '$1')
          .replace(/\\times/g, '×')
          .replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '($1/$2)')
          .replace(/\\sqrt\{(.+?)\}/g, '√($1)')
          .replace(/\\pm/g, '±')
          .replace(/\\(.)/g, '$1');
        pdf.setFontSize(16);
        pdf.setTextColor(51, 51, 51);
        const hintLines = pdf.splitTextToSize(readableHint, contentWidth - 20);
        pdf.text(hintLines, pageWidth / 2, margin + 50, { align: 'center', maxWidth: contentWidth - 20 });

        // Add new page for answer
        pdf.addPage();

        // Golden gradient background for back
        pdf.setFillColor(255, 235, 205);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Add decorative golden border
        pdf.setDrawColor(218, 165, 32);
        pdf.setLineWidth(2);
        pdf.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - (2 * margin) + 10, 'S');

        // Back of card - Answer
        pdf.setFontSize(24);
        pdf.setTextColor(139, 69, 19);
        pdf.text('Answer', pageWidth / 2, margin + 10, { align: 'center' });

        // Card number with golden badge
        pdf.setFillColor(255, 215, 0);
        pdf.roundedRect(pageWidth / 2 - 15, margin + 20, 30, 10, 3, 3, 'F');
        pdf.setFontSize(14);
        pdf.setTextColor(139, 69, 19);
        pdf.text(`Card ${card.card_order}`, pageWidth / 2, margin + 27, { align: 'center' });

        // Answer content - convert LaTeX to readable format
        const readableContent = card.content
          .replace(/\$\$(.+?)\$\$/g, '[$1]')
          .replace(/\$(.+?)\$/g, '$1')
          .replace(/\\times/g, '×')
          .replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '($1/$2)')
          .replace(/\\sqrt\{(.+?)\}/g, '√($1)')
          .replace(/\\pm/g, '±')
          .replace(/\\(.)/g, '$1');
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        const contentLines = pdf.splitTextToSize(readableContent, contentWidth - 20);
        
        let yPosition = margin + 50;
        const lineHeight = 7;
        const maxY = pageHeight - margin - 20;

        contentLines.forEach((line: string, lineIndex: number) => {
          if (yPosition + lineHeight > maxY) {
            pdf.addPage();
            // Repeat background for new page
            pdf.setFillColor(255, 235, 205);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            pdf.setDrawColor(218, 165, 32);
            pdf.setLineWidth(2);
            pdf.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - (2 * margin) + 10, 'S');
            yPosition = margin + 10;
          }
          pdf.text(line, pageWidth / 2, yPosition, { align: 'center', maxWidth: contentWidth - 20 });
          yPosition += lineHeight;
        });

        // Add footer with metadata
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`${flashcardSet?.title || 'Flashcard'}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      });

      // Save PDF
      const fileName = `flashcards-${flashcardSet?.title?.replace(/[^a-z0-9]/gi, '-') || 'set'}.pdf`;
      pdf.save(fileName);

      toast.success(`All ${cards.length} flashcards have been downloaded successfully.`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const renderMathContent = (text: string) => {
    // Split by display math ($$...$$)
    const displayMathRegex = /\$\$(.*?)\$\$/g;
    const parts = text.split(displayMathRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is display math
        try {
          return <BlockMath key={index} math={part} />;
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      } else {
        // Process inline math in this part
        const inlineMathRegex = /\$(.*?)\$/g;
        const inlineParts = part.split(inlineMathRegex);
        
        return inlineParts.map((iPart, iIndex) => {
          if (iIndex % 2 === 1) {
            // This is inline math
            try {
              return <InlineMath key={`${index}-${iIndex}`} math={iPart} />;
            } catch (e) {
              return <span key={`${index}-${iIndex}`}>{iPart}</span>;
            }
          }
          return <span key={`${index}-${iIndex}`}>{iPart}</span>;
        });
      }
    });
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      "from-purple-500 via-pink-500 to-rose-500",
      "from-blue-500 via-cyan-500 to-teal-500",
      "from-orange-500 via-red-500 to-pink-500",
      "from-green-500 via-emerald-500 to-teal-500",
      "from-indigo-500 via-purple-500 to-pink-500",
      "from-yellow-500 via-orange-500 to-red-500",
    ];
    return gradients[index % gradients.length];
  };

  const getPatternClass = (index: number) => {
    const patterns = [
      "bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]",
      "bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:40px_40px]",
      "bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.1)_0%,transparent_50%)]",
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.08)_75%)] bg-[length:30px_30px]",
      "bg-[conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.1)_0deg,transparent_60deg,rgba(255,255,255,0.1)_120deg)]",
      "bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.05),rgba(255,255,255,0.05)_10px,transparent_10px,transparent_20px)]",
    ];
    return patterns[index % patterns.length];
  };

  if (loading) {
    return (
      <Card className="border-2 border-rose-500/30 shadow-xl bg-gradient-to-br from-rose-100/90 via-pink-100/90 to-red-100/90 dark:from-rose-900/40 dark:via-pink-900/40 dark:to-red-900/40 backdrop-blur-sm p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </div>
      </Card>
    );
  }

  if (!flashcardSet || cards.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No flashcards found</p>
          <Button onClick={onClose} variant="outline" className="mt-4">
            Go Back
          </Button>
        </div>
      </Card>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden h-screen md:h-auto">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{flashcardSet.title}</h2>
            <p className="text-sm text-muted-foreground">
              {flashcardSet.curriculum} • {flashcardSet.topic}
              {flashcardSet.subtopic && ` • ${flashcardSet.subtopic}`}
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="text-muted-foreground">
              {isFlipped ? "Answer" : "Question"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="relative perspective-1000 flex-1 flex items-center">
          <button
            onClick={handleFlip}
            className={`w-full min-h-[300px] md:min-h-[400px] rounded-xl transition-all duration-500 transform-style-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front (Hint) */}
            <div
              className={`absolute inset-0 rounded-xl backface-hidden ${
                isFlipped ? "invisible" : "visible"
              }`}
            >
              <div className={`h-full rounded-xl bg-gradient-to-br ${getGradientClass(currentIndex)} p-1 shadow-2xl`}>
                <div className={`h-full rounded-lg bg-card ${getPatternClass(currentIndex)} p-8 flex flex-col items-center justify-center text-center`}>
                  <div className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                    Question
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    {renderMathContent(currentCard.hint)}
                  </div>
                  <div className="mt-8 text-sm text-muted-foreground">
                    Tap to reveal answer
                  </div>
                </div>
              </div>
            </div>

            {/* Back (Content) */}
            <div
              className={`absolute inset-0 rounded-xl backface-hidden rotate-y-180 ${
                isFlipped ? "visible" : "invisible"
              }`}
            >
              <div className={`h-full rounded-xl bg-gradient-to-br ${getGradientClass(currentIndex)} p-1 shadow-2xl`}>
                <div className={`h-full rounded-lg bg-card ${getPatternClass(currentIndex)} p-8 flex flex-col items-center justify-center text-center overflow-auto`}>
                  <div className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                    Answer
                  </div>
                  <div className="text-xl md:text-2xl text-foreground leading-relaxed">
                    {renderMathContent(currentCard.content)}
                  </div>
                  <div className="mt-8 text-sm text-muted-foreground">
                    Tap to see question
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
            size="lg"
            className="flex-1 h-12 md:h-10"
          >
            <ChevronLeft className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Previous</span>
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            size="icon"
            className="shrink-0 h-12 w-12 md:h-10 md:w-10"
            title="Reset to first card"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            variant="outline"
            size="lg"
            className="flex-1 h-12 md:h-10"
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRight className="h-5 w-5 md:ml-2" />
          </Button>
        </div>

        {/* Download PDF Button */}
        <Button
          onClick={handleDownloadPDF}
          className="w-full mt-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 h-12 md:h-10"
        >
          <Download className="w-5 h-5 md:w-4 md:h-4 mr-2" />
          Download as PDF
        </Button>
      </div>
    </Card>
  );
};
