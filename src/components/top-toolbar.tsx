import { Button } from "../components/ui/button"
import { Plus, Network, FolderPlus, Search, ArrowLeft } from "lucide-react"
import { Input } from "../components/ui/input"
interface TopToolbarProps {
  onNewNote: () => void
  onNewFolder: () => void
  onToggleView: () => void
  viewMode: "editor" | "graph"
  onNavigateToLanding?: () => void
}

export function TopToolbar({ onNewNote, onNewFolder, onToggleView, viewMode, onNavigateToLanding }: TopToolbarProps) {
  return (
    <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {onNavigateToLanding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToLanding}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewNote}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Note
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNewFolder}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <FolderPlus className="h-4 w-4 mr-1" />
          New Folder
        </Button>

        <div className="w-px h-4 bg-border mx-2" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleView}
          className={`h-8 px-2 ${viewMode === "graph" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Network className="h-4 w-4 mr-1" />
          Graph View
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search notes..." className="w-64 h-8 pl-7 bg-muted/50 border-0 text-sm" />
        </div>
      </div>
    </div>
  )
}
