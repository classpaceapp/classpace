import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { toast } from "sonner";
import "katex/dist/katex.min.css";
import { BlockMath, InlineMath } from "react-katex";

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

interface PersonalFlashcardViewerProps {
  flashcardSetId: string;
  onClose: () => void;
}

export const PersonalFlashcardViewer = ({ flashcardSetId, onClose }: PersonalFlashcardViewerProps) => {
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
      const { data: setData, error: setError } = await supabase
        .from("personal_flashcards")
        .select("*")
        .eq("id", flashcardSetId)
        .single();

      if (setError) throw setError;
      setFlashcardSet(setData);

      const { data: cardsData, error: cardsError } = await supabase
        .from("personal_flashcard_cards")
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

  const renderMath = (text: string) => {
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        const math = part.slice(2, -2);
        return <BlockMath key={index} math={math} />;
      } else if (part.startsWith("$") && part.endsWith("$")) {
        const math = part.slice(1, -1);
        return <InlineMath key={index} math={math} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  if (loading || !flashcardSet) {
    return (
      <Card className="border-2 border-border/50 shadow-2xl bg-white/80 backdrop-blur-xl">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading flashcards...</p>
        </CardContent>
      </Card>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <Card className="border-2 border-border/50 shadow-2xl bg-white/80 backdrop-blur-xl">
      <CardContent className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sets
          </Button>
          <div className="text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {flashcardSet.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {flashcardSet.curriculum} • {flashcardSet.topic}
            </p>
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            Card {currentIndex + 1} / {cards.length}
          </div>
        </div>

        <div className="mb-6">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative h-96 cursor-pointer"
            style={{ perspective: "1000px" }}
          >
            <div
              className={`absolute inset-0 transition-all duration-500 transform-gpu`}
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front */}
              <Card
                className="absolute inset-0 backface-hidden border-2 border-purple-500/30 shadow-2xl bg-gradient-to-br from-purple-100/90 via-pink-100/90 to-rose-100/90"
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardContent className="h-full flex items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <div className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
                      Question
                    </div>
                    <div className="text-2xl font-semibold text-foreground">
                      {renderMath(currentCard.hint)}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-8">
                      <RotateCw className="h-4 w-4" />
                      Click to reveal answer
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Back */}
              <Card
                className="absolute inset-0 backface-hidden border-2 border-blue-500/30 shadow-2xl bg-gradient-to-br from-blue-100/90 via-cyan-100/90 to-teal-100/90"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <CardContent className="h-full flex items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                      Answer
                    </div>
                    <div className="text-xl text-foreground">
                      {renderMath(currentCard.content)}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-8">
                      <RotateCw className="h-4 w-4" />
                      Click to see question
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={handlePrevious}
            variant="outline"
            size="lg"
            disabled={cards.length <= 1}
            className="border-2"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Previous
          </Button>
          <Button
            onClick={() => setIsFlipped(!isFlipped)}
            variant="outline"
            size="lg"
            className="border-2"
          >
            <RotateCw className="h-5 w-5 mr-2" />
            Flip Card
          </Button>
          <Button
            onClick={handleNext}
            variant="outline"
            size="lg"
            disabled={cards.length <= 1}
            className="border-2"
          >
            Next
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
