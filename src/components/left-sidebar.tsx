import { useState } from "react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Skeleton } from "../components/ui/skeleton";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  File,
  Image,
  Archive,
  Download,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { Note, Folder } from "./notes-app";

interface LeftSidebarProps {
  notes: Note[];
  folders: Folder[];
  onNoteSelect: (noteId: string) => void;
  onNewNote?: () => void;
  downloadFile?: (secondary_blob_id: string, fileName: string) => void;
  isLoading?: boolean;
}

export function LeftSidebar({
  notes,
  folders,
  onNoteSelect,
  downloadFile,
  isLoading = false,
}: LeftSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["notes", "files"]) // Default to expand notes and files folders
  );
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col min-h-0 transition-all duration-300",
        isCollapsed ? "w-12" : "w-80"
      )}
    >
      <div className="p-4 border-b border-sidebar-border flex-shrink-0 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-sidebar-foreground">
            Notes
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-sidebar-accent"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          // Loading state
          <div className="p-2 space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <div className="ml-4 space-y-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-4/5" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <div className="ml-4 space-y-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </div>
        ) : isCollapsed ? (
          // Collapsed view - show only icons
          <div className="p-1 space-y-1">
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isCollapsed) {
                    setIsCollapsed(false);
                    setTimeout(() => toggleFolder(folder.id), 100);
                  } else {
                    toggleFolder(folder.id);
                  }
                }}
                className="w-full h-8 p-0 justify-center hover:bg-sidebar-accent"
                title={folder.name}
              >
                <FileText className="h-4 w-4" />
              </Button>
            ))}
          </div>
        ) : (
          // Expanded view - show full content
          <div className="p-2">
            {/* Folders */}
            {folders.map((folder) => (
              <div key={folder.id} className="mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFolder(folder.id)}
                  className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  {expandedFolders.has(folder.id) ? (
                    <ChevronDown className="h-3 w-3 mr-1 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                  )}
                  <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="text-sm truncate flex-1 text-left max-w-[160px]">
                    {folder.name.length > 25
                      ? `${folder.name.slice(0, 22)}...`
                      : folder.name}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground flex-shrink-0">
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
                          "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent group min-w-0",
                          selectedNoteId === note.id &&
                            "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                        title={note.title} // Show full title on hover
                      >
                        {note.isFile ? (
                          note.fileExtension === "pdf" ? (
                            <File className="h-3 w-3 mr-2 flex-shrink-0 text-red-500" />
                          ) : note.fileExtension === "jpg" ||
                            note.fileExtension === "png" ||
                            note.fileExtension === "gif" ? (
                            <Image className="h-3 w-3 mr-2 flex-shrink-0 text-green-500" />
                          ) : note.fileExtension === "zip" ||
                            note.fileExtension === "rar" ? (
                            <Archive className="h-3 w-3 mr-2 flex-shrink-0 text-yellow-500" />
                          ) : note.fileExtension === "txt" ||
                            note.fileExtension === "md" ? (
                            <FileText className="h-3 w-3 mr-2 flex-shrink-0 text-blue-500" />
                          ) : (
                            <File className="h-3 w-3 mr-2 flex-shrink-0" />
                          )
                        ) : (
                          <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-sm truncate flex-1 text-left min-w-0 max-w-[160px]">
                          {note.title.length > 25
                            ? `${note.title.slice(0, 22)}...`
                            : note.title}
                        </span>
                        {note.isFile &&
                          note.secondary_blob_id &&
                          downloadFile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(
                                  note.secondary_blob_id!,
                                  note.title
                                );
                              }}
                              className="h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100 hover:bg-primary/20 flex-shrink-0"
                            >
                              <Download className="h-3 w-3" />
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
              <div className="mb-6">
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
                        "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent min-w-0",
                        selectedNoteId === note.id &&
                          "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                      title={note.title} // Show full title on hover
                    >
                      <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="text-sm truncate flex-1 text-left min-w-0 max-w-[160px]">
                        {note.title.length > 25
                          ? `${note.title.slice(0, 22)}...`
                          : note.title}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
