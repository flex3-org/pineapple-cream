import { useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Link2,
  Hash,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { Note } from "./notes-app";

interface RightSidebarProps {
  activeNote: Note | null;
  allNotes: Note[];
}

export function RightSidebar({ activeNote, allNotes }: RightSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const insights = useMemo(() => {
    if (!activeNote) return null;

    // Find linked mentions (notes that reference this note's title)
    const linkedMentions = allNotes.filter(
      (note) =>
        note.id !== activeNote.id &&
        (note.content.toLowerCase().includes(activeNote.title.toLowerCase()) ||
          note.title.toLowerCase().includes(activeNote.title.toLowerCase()))
    );

    // Find unlinked mentions (notes with similar tags or content)
    const unlinkedMentions = allNotes.filter((note) => {
      if (note.id === activeNote.id) return false;
      if (linkedMentions.some((linked) => linked.id === note.id)) return false;

      // Check for shared tags
      const sharedTags = note.tags.filter((tag) =>
        activeNote.tags.includes(tag)
      );
      return sharedTags.length > 0;
    });

    // Extract potential links from content (simple regex for URLs)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = activeNote.content.match(urlRegex) || [];

    // Word count and reading time
    const wordCount = activeNote.content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    // Creation and modification stats
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - activeNote.createdAt.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const daysSinceModified = Math.floor(
      (new Date().getTime() - activeNote.updatedAt.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return {
      linkedMentions,
      unlinkedMentions,
      links,
      wordCount,
      readingTime,
      daysSinceCreated,
      daysSinceModified,
    };
  }, [activeNote, allNotes]);

  if (!activeNote || !insights) {
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
              Insights
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
              Select a note to see insights and connections
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
            Insights
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
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-6">
            {/* Note Statistics */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Statistics
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sidebar-accent rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Words</span>
                  </div>
                  <p className="text-lg font-semibold text-sidebar-foreground mt-1">
                    {insights.wordCount}
                  </p>
                </div>
                <div className="bg-sidebar-accent rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Read time
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-sidebar-foreground mt-1">
                    {insights.readingTime}m
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Created {insights.daysSinceCreated} days ago</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  <span>Modified {insights.daysSinceModified} days ago</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tags */}
            {activeNote.tags.length > 0 && (
              <>
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeNote.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Hash className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Linked Mentions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Linked mentions
                </h4>
                <span className="text-xs text-muted-foreground">
                  {insights.linkedMentions.length}
                </span>
              </div>
              {insights.linkedMentions.length > 0 ? (
                <div className="space-y-2">
                  {insights.linkedMentions.map((note) => (
                    <Button
                      key={note.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-auto p-2 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                          {note.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No backlinks found.
                </p>
              )}
            </div>

            <Separator />

            {/* Unlinked Mentions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Unlinked mentions
                </h4>
                <span className="text-xs text-muted-foreground">
                  {insights.unlinkedMentions.length}
                </span>
              </div>
              {insights.unlinkedMentions.length > 0 ? (
                <div className="space-y-2">
                  {insights.unlinkedMentions.slice(0, 5).map((note) => (
                    <Button
                      key={note.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-auto p-2 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                          {note.title}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {note.tags
                            .filter((tag) => activeNote.tags.includes(tag))
                            .map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs px-1 py-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No related notes found.
                </p>
              )}
            </div>

            {/* External Links */}
            {insights.links.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      External links
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {insights.links.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {insights.links.slice(0, 5).map((link, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-auto p-2 text-left"
                        asChild
                      >
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Link2 className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="text-xs text-sidebar-foreground truncate">
                            {link.replace(/^https?:\/\//, "").split("/")[0]}
                          </span>
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
