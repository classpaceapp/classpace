import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { normalizeMathDelimiters } from "@/utils/phoenixMathUtils";
import { MathRenderer } from "@/components/quiz/MathRenderer";
import jsPDF from "jspdf";

interface Note {
  id: string;
  title: string;
  curriculum: string;
  topic: string;
  subtopic: string | null;
  content: string;
  created_at: string;
}

interface PersonalNotesViewerProps {
  noteId: string;
  onClose: () => void;
}

export const PersonalNotesViewer = ({ noteId, onClose }: PersonalNotesViewerProps) => {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [noteId]);

  const fetchNote = async () => {
    try {
      const { data, error } = await supabase
        .from("personal_notes")
        .select("*")
        .eq("id", noteId)
        .single();

      if (error) throw error;
      setNote(data);
    } catch (error) {
      console.error("Error fetching note:", error);
      toast.error("Failed to load note");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!note) return;

    setDownloading(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Add gradient header background
      pdf.setFillColor(16, 185, 129); // emerald-500
      pdf.rect(0, 0, pageWidth, 40, "F");

      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.text(note.title, margin, yPosition);
      yPosition += 10;

      // Metadata
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${note.curriculum} • ${note.topic}${note.subtopic ? ` • ${note.subtopic}` : ''}`, margin, yPosition);
      yPosition += 15;

      // Reset text color for content
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");

      // Process content - split by lines and handle markdown
      const lines = note.content.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          yPosition += 5;
          checkPageBreak(5);
          continue;
        }

        // Handle headings
        if (trimmedLine.startsWith('###')) {
          checkPageBreak(15);
          yPosition += 5;
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(16, 185, 129);
          const text = trimmedLine.replace(/^###\s*/, '');
          pdf.text(text, margin, yPosition);
          yPosition += 8;
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);
          continue;
        }

        if (trimmedLine.startsWith('##')) {
          checkPageBreak(18);
          yPosition += 7;
          pdf.setFontSize(16);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(20, 184, 166);
          const text = trimmedLine.replace(/^##\s*/, '');
          pdf.text(text, margin, yPosition);
          yPosition += 10;
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);
          continue;
        }

        // Handle bullet points
        if (trimmedLine.startsWith('-')) {
          checkPageBreak(10);
          const text = trimmedLine.replace(/^-\s*/, '');
          const wrappedText = pdf.splitTextToSize(`• ${text}`, maxWidth - 5);
          pdf.text(wrappedText, margin + 5, yPosition);
          yPosition += wrappedText.length * 6;
          continue;
        }

        // Handle regular paragraphs - convert LaTeX to readable format
        checkPageBreak(10);
        // Convert LaTeX to more readable format for PDF
        const readableText = trimmedLine
          .replace(/\$\$(.+?)\$\$/g, '[$1]')  // Display math becomes [equation]
          .replace(/\$(.+?)\$/g, '$1')         // Inline math removes $ delimiters
          .replace(/\\times/g, '×')
          .replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '($1/$2)')
          .replace(/\\sqrt\{(.+?)\}/g, '√($1)')
          .replace(/\\pm/g, '±')
          .replace(/\\leq/g, '≤')
          .replace(/\\geq/g, '≥')
          .replace(/\\neq/g, '≠')
          .replace(/\\approx/g, '≈')
          .replace(/\\_/g, '_')
          .replace(/\\(.)/g, '$1');  // Remove remaining backslashes

        const wrappedText = pdf.splitTextToSize(readableText, maxWidth);
        pdf.text(wrappedText, margin, yPosition);
        yPosition += wrappedText.length * 6 + 3;
      }

      // Add footer with page numbers
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        pdf.text(
          `Created: ${new Date(note.created_at).toLocaleDateString()}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: "right" }
        );
      }

      pdf.save(`${note.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-emerald-500/30 shadow-2xl bg-gradient-to-br from-emerald-100/90 via-teal-100/90 to-cyan-100/90">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </CardContent>
      </Card>
    );
  }

  if (!note) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Note not found</p>
          <Button onClick={onClose} className="mt-4">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border/50 shadow-2xl bg-white/80 backdrop-blur-xl">
      <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {note.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {note.curriculum} • {note.topic}{note.subtopic ? ` • ${note.subtopic}` : ''}
              </p>
            </div>
          </div>
          <Button
            onClick={downloadPDF}
            disabled={downloading}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="prose prose-emerald max-w-none">
          <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10 rounded-xl p-6 border-2 border-emerald-500/20">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold text-foreground mb-4 mt-6">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold text-foreground mb-3 mt-5">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg font-semibold text-foreground mb-2 mt-3">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="mb-3 text-foreground leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-foreground">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-emerald-700">{children}</strong>
                ),
                code: ({ children }) => (
                  <code className="bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-lg overflow-x-auto mb-3">
                    {children}
                  </pre>
                ),
              }}
            >
              {normalizeMathDelimiters(note.content)}
            </ReactMarkdown>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-lg border border-emerald-500/20">
          <p className="text-sm text-muted-foreground">
            Created on {new Date(note.created_at).toLocaleDateString()} at{' '}
            {new Date(note.created_at).toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};