
import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { ScrollArea } from "../components/ui/scroll-area"
import { Textarea } from "../components/ui/textarea"
import { X, FileText, Circle } from "lucide-react"
import { cn } from "../lib/utils"
import type { Note, Tab } from "./notes-app"
import { GraphView } from "./graph-view"

interface CenterEditorProps {
  tabs: Tab[]
  activeTabId: string | null
  activeNote: Note | null
  onTabSelect: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onNoteUpdate?: (noteId: string, content: string, title?: string) => void
  viewMode: "editor" | "graph"
  notes: Note[]
}

export function CenterEditor({
  tabs,
  activeTabId,
  activeNote,
  onTabSelect,
  onTabClose,
  onNoteUpdate,
  viewMode,
  notes,
}: CenterEditorProps) {
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")

  useEffect(() => {
    if (activeNote) {
      setContent(activeNote.content)
      setTitle(activeNote.title)
    }
  }, [activeNote])

  useEffect(() => {
    if (!activeNote || !onNoteUpdate) return

    const timeoutId = setTimeout(() => {
      if (content !== activeNote.content || title !== activeNote.title) {
        onNoteUpdate(activeNote.id, content, title)
      }
    }, 1000) // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId)
  }, [content, title, activeNote, onNoteUpdate])

  if (viewMode === "graph") {
    return (
      <div className="flex-1 bg-background">
        <GraphView notes={notes} />
      </div>
    )
  }

  if (tabs.length === 0) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">No file is open</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Create new note (⌘ N)</p>
              <p>Go to file (⌘ O)</p>
              <p>See recent files (⌘ O)</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background flex flex-col">
      {/* Tab Bar */}
      <div className="border-b border-border bg-card">
        <ScrollArea className="w-full">
          <div className="flex">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border-r border-border cursor-pointer group min-w-0",
                  activeTabId === tab.id
                    ? "bg-background text-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
                onClick={() => onTabSelect(tab.id)}
              >
                <FileText className="h-3 w-3 flex-shrink-0" />
                <span className="text-sm truncate max-w-32">{tab.title}</span>
                {tab.isDirty && <Circle className="h-2 w-2 fill-current flex-shrink-0" />}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose(tab.id)
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
      {activeNote && (
        <div className="flex-1 flex flex-col">
          {/* Note Title */}
          <div className="p-4 border-b border-border">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground"
              placeholder="Untitled"
            />
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Created {activeNote.createdAt.toLocaleDateString()}</span>
              <span>Modified {activeNote.updatedAt.toLocaleDateString()}</span>
              {activeNote.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <span>Tags:</span>
                  {activeNote.tags.map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content Editor */}
          <div className="flex-1 p-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing..."
              className="w-full h-full resize-none border-none bg-transparent text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
              style={{ minHeight: "calc(100vh - 200px)" }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
