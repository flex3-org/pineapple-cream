import { useState } from "react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Calendar,
  Hash,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { Note, Folder } from "./notes-app";

interface LeftSidebarProps {
  notes: Note[];
  folders: Folder[];
  onNoteSelect: (noteId: string) => void;
  onNewNote?: () => void;
  downloadFile?: (secondary_blob_id: string, fileName: string) => void;
}

export function LeftSidebar({
  notes,
  folders,
  onNoteSelect,
  downloadFile,
}: LeftSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["blockchain", "daily", "research"])
  );
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId);
    onNoteSelect(noteId);
  };

  const getNotesInFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return [];
    return notes.filter((note) => folder.children.includes(note.id));
  };

  const getUnorganizedNotes = () => {
    const organizedNoteIds = new Set(
      folders.flatMap((folder) => folder.children)
    );
    return notes.filter((note) => !organizedNoteIds.has(note.id));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Notes</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Folders */}
          {folders.map((folder) => (
            <div key={folder.id} className="mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFolder(folder.id)}
                className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                {expandedFolders.has(folder.id) ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                <FileText className="h-3 w-3 mr-2" />
                <span className="text-sm">{folder.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {getNotesInFolder(folder.id).length}
                </span>
              </Button>

              {expandedFolders.has(folder.id) && (
                <div className="ml-4 mt-1 space-y-1">
                  {getNotesInFolder(folder.id).map((note) => (
                    <Button
                      key={note.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNoteSelect(note.id)}
                      className={cn(
                        "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent group",
                        selectedNoteId === note.id &&
                          "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      {note.isFile ? (
                        <span className="mr-2 flex-shrink-0">
                          {note.fileExtension === 'pdf' ? '📄' :
                           note.fileExtension === 'jpg' || note.fileExtension === 'png' || note.fileExtension === 'gif' ? '🖼️' :
                           note.fileExtension === 'zip' || note.fileExtension === 'rar' ? '📦' :
                           note.fileExtension === 'txt' || note.fileExtension === 'md' ? '📝' :
                           '📁'}
                        </span>
                      ) : (
                        <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                      )}
                      <span className="text-sm truncate flex-1 text-left">
                        {note.title}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatDate(note.updatedAt)}
                      </span>
                      {note.isFile && note.secondary_blob_id && downloadFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(note.secondary_blob_id!, note.title);
                          }}
                          className="h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100 hover:bg-primary/20"
                        >
                          ⬇️
                        </Button>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Unorganized Notes */}
          {getUnorganizedNotes().length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Other Notes
                </span>
              </div>
              <div className="space-y-1">
                {getUnorganizedNotes().map((note) => (
                  <Button
                    key={note.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNoteSelect(note.id)}
                    className={cn(
                      "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                      selectedNoteId === note.id &&
                        "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="text-sm truncate flex-1 text-left">
                      {note.title}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {formatDate(note.updatedAt)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Notes Section */}
          <div className="mt-6">
            <div className="px-2 py-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recent
              </span>
            </div>
            <div className="space-y-1">
              {notes
                .slice()
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                .slice(0, 5)
                .map((note) => (
                  <Button
                    key={`recent-${note.id}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNoteSelect(note.id)}
                    className={cn(
                      "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                      selectedNoteId === note.id &&
                        "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Calendar className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="text-sm truncate flex-1 text-left">
                      {note.title}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {formatDate(note.updatedAt)}
                    </span>
                  </Button>
                ))}
            </div>
          </div>

          {/* Tags Section */}
          <div className="mt-6">
            <div className="px-2 py-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tags
              </span>
            </div>
            <div className="space-y-1">
              {Array.from(new Set(notes.flatMap((note) => note.tags)))
                .filter(Boolean)
                .map((tag) => (
                  <Button
                    key={tag}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    <Hash className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="text-sm truncate flex-1 text-left">
                      {tag}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {notes.filter((note) => note.tags.includes(tag)).length}
                    </span>
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
