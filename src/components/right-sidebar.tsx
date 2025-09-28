import { useState } from "react";
import { Button } from "../components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "../lib/utils";
import type { Note } from "./notes-app";

interface RightSidebarProps {
  activeNote: Note | null;
}

export function RightSidebar({ activeNote }: RightSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCreateSummary = async () => {
    if (!activeNote) return;

    try {
      const response = await fetch("http://81.15.150.173:8000/get_tag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: activeNote.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.tag) {
        alert(`Summary: ${data.tag}`);
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      alert("Failed to generate summary. Please try again.");
    }
  };

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
        <div className="p-4">
          <Button
            onClick={handleCreateSummary}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create Summary
          </Button>
        </div>
      )}
    </div>
  );
}
