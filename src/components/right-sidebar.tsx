import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { PanelRightClose, PanelRightOpen, Brain } from "lucide-react";
import { cn } from "../lib/utils";
import type { Note } from "./notes-app";
import { extractTextFromPDF } from "../lib/pdf-extractor";

interface RightSidebarProps {
  activeNote: Note | null;
  chatContext?: {
    conversationId?: string;
    messages?: Array<{
      role: string;
      content: string;
      timestamp?: string;
    }>;
    topic?: string;
  };
}

export function RightSidebar({ activeNote }: RightSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<any>(null);

  // Clear analyze result when active note changes
  useEffect(() => {
    setAnalyzeResult(null);
  }, [activeNote?.id]);

  // Extract text for analysis based on file type
  const extractTextForAnalysis = async (note: Note): Promise<string> => {
    if (!note.isFile) {
      // For regular notes, use the content directly
      return note.content;
    }

    // For PDF files, extract actual text content
    if (note.fileExtension === "pdf" && note.secondary_blob_id) {
      const pdfUrl = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-quilt-patch-id/${note.secondary_blob_id}`;

      try {
        // Fetch the PDF file from the URL
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }

        const blob = await response.blob();
        const file = new File([blob], note.title, { type: "application/pdf" });

        const extractedText = await extractTextFromPDF(file, 10);
        const extractionResult = {
          text: extractedText,
          error: null,
          pageCount: 1,
        };

        if (extractionResult.error) {
          // Fallback to metadata if extraction fails
          const title = note.title;
          const metadata = note.file_metadata;
          const fileInfo = `File: ${title}\nType: PDF Document\nSize: ${
            metadata?.file_size
              ? (metadata.file_size / 1024 / 1024).toFixed(2) + " MB"
              : "Unknown"
          }\nContent Type: ${metadata?.content_type || "application/pdf"}`;

          return `${fileInfo}\n\nDescription: ${note.content}\n\n[Note: Could not extract PDF text - ${extractionResult.error}]`;
        }

        // Return extracted PDF text with metadata
        const title = note.title;
        const metadata = note.file_metadata;
        const fileInfo = `File: ${title}\nType: PDF Document (${
          extractionResult.pageCount
        } pages)\nSize: ${
          metadata?.file_size
            ? (metadata.file_size / 1024 / 1024).toFixed(2) + " MB"
            : "Unknown"
        }`;

        return `${fileInfo}\n\nExtracted Text:\n${extractionResult.text}`;
      } catch (error) {
        console.error("Error extracting PDF text:", error);
        // Fallback to metadata
        const title = note.title;
        const metadata = note.file_metadata;
        const fileInfo = `File: ${title}\nType: PDF Document\nSize: ${
          metadata?.file_size
            ? (metadata.file_size / 1024 / 1024).toFixed(2) + " MB"
            : "Unknown"
        }`;

        return `${fileInfo}\n\nDescription: ${note.content}\n\n[Note: Could not extract PDF text due to an error]`;
      }
    }

    // For other files, return the content description
    return note.content;
  };

  const handleAnalyze = async () => {
    if (!activeNote) return;

    setIsAnalyzing(true);
    setAnalyzeResult(null);

    try {
      // Extract text (now async for PDF processing)
      const textToAnalyze = await extractTextForAnalysis(activeNote);

      const response = await fetch("http://81.15.150.173:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToAnalyze,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalyzeResult(data);
    } catch (error) {
      console.error("Error analyzing content:", error);
      setAnalyzeResult({
        error: "Failed to analyze content. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderAnalyzeResult = () => {
    if (!analyzeResult) return null;

    if (analyzeResult.error) {
      return (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{analyzeResult.error}</p>
        </div>
      );
    }

    let resultText = "";
    if (analyzeResult.analysis) {
      resultText = analyzeResult.analysis;
    } else if (analyzeResult.result) {
      resultText = analyzeResult.result;
    } else if (analyzeResult.summary) {
      resultText = analyzeResult.summary;
    } else if (analyzeResult.insights) {
      resultText = Array.isArray(analyzeResult.insights)
        ? analyzeResult.insights.join("\n")
        : analyzeResult.insights;
    } else {
      resultText = JSON.stringify(analyzeResult, null, 2);
    }

    return (
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-sm mb-2 text-blue-800">
          Analysis Result
        </h4>
        <div className="text-sm text-blue-700 whitespace-pre-wrap">
          {resultText}
        </div>
      </div>
    );
  };

  // Check if current note can be analyzed (notes or PDFs only)
  const canAnalyze =
    activeNote &&
    (!activeNote.isFile || // Regular notes
      activeNote.fileExtension === "pdf"); // PDF files

  if (!activeNote) {
    return (
      <div
        className={cn(
          "bg-sidebar border-l border-sidebar-border flex flex-col min-h-0 transition-all duration-300",
          isCollapsed ? "w-12" : "w-80"
        )}
      >
        <div className="p-4 border-b border-sidebar-border flex-shrink-0 flex items-center justify-between">
          {!isCollapsed && (
            <h3 className="text-sm font-medium text-sidebar-foreground">
              Analyze
            </h3>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 hover:bg-sidebar-accent"
          >
            {isCollapsed ? (
              <PanelRightOpen className="h-4 w-4" />
            ) : (
              <PanelRightClose className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center px-4">
              Select a note to analyze and get suggestions
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-sidebar border-l border-sidebar-border flex flex-col min-h-0 transition-all duration-300",
        isCollapsed ? "w-12" : "w-80"
      )}
    >
      <div className="p-4 border-b border-sidebar-border flex-shrink-0 flex items-center justify-between">
        {!isCollapsed && (
          <h3 className="text-sm font-medium text-sidebar-foreground">
            Analyze
          </h3>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-sidebar-accent"
        >
          {isCollapsed ? (
            <PanelRightOpen className="h-4 w-4" />
          ) : (
            <PanelRightClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="p-4 space-y-3">
          {canAnalyze && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze Content
                </>
              )}
            </Button>
          )}

          {renderAnalyzeResult()}

          {activeNote && !canAnalyze && (
            <div className="text-xs text-muted-foreground text-center p-2 bg-muted/20 rounded">
              Analysis is only available for notes and PDF files
            </div>
          )}
        </div>
      )}
    </div>
  );
}
