import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Skeleton } from "../components/ui/skeleton";
import { X, FileText, Circle, Loader2, File, Image, Archive, Download, Edit } from "lucide-react";
import { cn } from "../lib/utils";
import type { Note, Tab } from "./notes-app";
import { GraphView } from "./graph-view";

interface CenterEditorProps {
  tabs: Tab[];
  activeTabId: string | null;
  activeNote: Note | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  viewMode: "editor" | "graph";
  notes: Note[];
  downloadFile?: (secondary_blob_id: string, fileName: string) => void;
  isLoadingNote?: boolean;
}

export function CenterEditor({
  tabs,
  activeTabId,
  activeNote,
  onTabSelect,
  onTabClose,
  viewMode,
  notes,
  downloadFile,
  isLoadingNote = false,
}: CenterEditorProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (activeNote) {
      setContent(activeNote.content);
      setTitle(activeNote.title);
    }
  }, [activeNote]);

  // No auto-save needed since everything is view-only

  if (viewMode === "graph") {
    return (
      <div className="flex-1 bg-background">
        <GraphView notes={notes} />
      </div>
    );
  }

  if (tabs.length === 0) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              No file is open
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Create new note (⌘ N)</p>
              <p>Go to file (⌘ O)</p>
              <p>See recent files (⌘ O)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background flex flex-col min-h-0">
      {/* Tab Bar */}
      <div className="border-b border-border bg-card flex-shrink-0">
        <ScrollArea className="w-full">
          <div className="flex">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border-r border-border cursor-pointer group min-w-0",
                  activeTabId === tab.id
                    ? "bg-background text-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => onTabSelect(tab.id)}
              >
                <FileText className="h-3 w-3 flex-shrink-0" />
                <span className="text-sm truncate max-w-32">{tab.title}</span>
                {tab.isDirty && (
                  <Circle className="h-2 w-2 fill-current flex-shrink-0" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Editor Area */}
      {isLoadingNote ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Loading Title */}
          <div className="p-4 border-b border-border flex-shrink-0">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <div className="flex items-center gap-4 mt-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>

          {/* Loading Content */}
          <div className="flex-1 p-4 space-y-4">
            <div className="bg-muted/30 rounded-lg p-6 min-h-[400px] flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading note...</p>
            </div>
          </div>
        </div>
      ) : activeNote ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Title - View Only */}
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="text-2xl font-bold text-foreground">
              {title || "Untitled"}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Created {activeNote.createdAt.toLocaleDateString()}</span>
              <span>Modified {activeNote.updatedAt.toLocaleDateString()}</span>
              {activeNote.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <span>Tags:</span>
                  {activeNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-muted rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content Display - View Only */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4">
              {activeNote.isFile && activeNote.secondary_blob_id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        {activeNote.fileExtension === "pdf" ? (
                          <File className="h-6 w-6 text-red-500" />
                        ) : activeNote.fileExtension === "jpg" ||
                          activeNote.fileExtension === "png" ||
                          activeNote.fileExtension === "gif" ? (
                          <Image className="h-6 w-6 text-green-500" />
                        ) : activeNote.fileExtension === "zip" ||
                          activeNote.fileExtension === "rar" ? (
                          <Archive className="h-6 w-6 text-yellow-500" />
                        ) : activeNote.fileExtension === "txt" ||
                          activeNote.fileExtension === "md" ? (
                          <FileText className="h-6 w-6 text-blue-500" />
                        ) : (
                          <File className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{activeNote.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {activeNote.fileExtension?.toUpperCase()} File
                          {activeNote.file_metadata?.file_size &&
                            ` • ${(
                              activeNote.file_metadata.file_size /
                              1024 /
                              1024
                            ).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>
                    {downloadFile && (
                      <Button
                        onClick={() =>
                          downloadFile(
                            activeNote.secondary_blob_id!,
                            activeNote.title
                          )
                        }
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    )}
                  </div>

                  {/* File Preview Area - Images Only with IMG tag */}
                  <div className="bg-muted/30 rounded-lg p-4 min-h-[400px]">
                    {/* Image Preview - ONLY using IMG tag */}
                    {(activeNote.fileExtension === "jpg" ||
                      activeNote.fileExtension === "jpeg" ||
                      activeNote.fileExtension === "png" ||
                      activeNote.fileExtension === "gif" ||
                      activeNote.fileExtension === "webp") &&
                      activeNote.secondary_blob_id &&
                      !activeNote.secondary_blob_id.startsWith("walrus_") && (
                        <div className="text-center">
                          <img
                            src={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-quilt-patch-id/${activeNote.secondary_blob_id}`}
                            alt={`${activeNote.title} preview`}
                            style={{
                              width: "100%",
                              maxWidth: "100%",
                              maxHeight: "600px",
                              objectFit: "contain",
                              borderRadius: "8px",
                              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                            }}
                            onError={(e) => {
                              // Fallback when image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                const fallbackDiv =
                                  document.createElement("div");
                                fallbackDiv.className =
                                  "text-center text-muted-foreground mt-4";
                                fallbackDiv.innerHTML = `
                                <div class="w-16 h-16 mx-auto bg-muted rounded-lg flex items-center justify-center mb-4">
                                  <svg class="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                </div>
                                <p class="text-lg font-semibold mb-2">Unable to load image</p>
                                <p class="text-sm">Use the download button to access the file</p>
                              `;
                                parent.appendChild(fallbackDiv);
                              }
                            }}
                          />
                        </div>
                      )}

                    {/* Non-Image Files OR Images without valid blob ID - Show info only */}
                    {(!["jpg", "jpeg", "png", "gif", "webp"].includes(
                      activeNote.fileExtension || ""
                    ) ||
                      !activeNote.secondary_blob_id ||
                      activeNote.secondary_blob_id.startsWith("walrus_")) && (
                        <div className="text-center text-muted-foreground">
                          <div className="w-24 h-24 mx-auto bg-muted rounded-lg flex items-center justify-center mb-4">
                            {activeNote.fileExtension === "pdf" ? (
                              <File className="h-12 w-12 text-red-500" />
                            ) : activeNote.fileExtension === "jpg" ||
                              activeNote.fileExtension === "jpeg" ||
                              activeNote.fileExtension === "png" ||
                              activeNote.fileExtension === "gif" ||
                              activeNote.fileExtension === "webp" ? (
                              <Image className="h-12 w-12 text-green-500" />
                            ) : activeNote.fileExtension === "zip" ||
                              activeNote.fileExtension === "rar" ? (
                              <Archive className="h-12 w-12 text-yellow-500" />
                            ) : activeNote.fileExtension === "txt" ||
                              activeNote.fileExtension === "md" ? (
                              <FileText className="h-12 w-12 text-blue-500" />
                            ) : (
                              <File className="h-12 w-12" />
                            )}
                          </div>
                          <h3 className="text-lg font-semibold mb-2">
                            {activeNote.title}
                          </h3>
                          <p className="mb-4">
                            {activeNote.fileExtension?.toUpperCase()} File
                          </p>
                          <p className="text-sm">
                            {["jpg", "jpeg", "png", "gif", "webp"].includes(
                              activeNote.fileExtension || ""
                            )
                              ? "Image preview not available. Use the download button to access the file."
                              : "Use the download button above to access the file content."}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                /* Note Content - View Only */
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-6 min-h-[400px]">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {content || "No content available"}
                      </pre>
                    </div>
                  </div>
                  <div className="text-center text-muted-foreground text-sm p-4 bg-muted/20 rounded-lg flex items-center justify-center gap-2">
                    <Edit className="h-4 w-4" />
                    Notes are view-only. Use "New Note" to create new content.
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  );
}
