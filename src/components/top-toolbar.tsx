import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Plus,
  Network,
  FolderPlus,
  Search,
  ArrowLeft,
  Upload,
  Database,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { UploadFileModal } from "./upload-file-modal";
import { CreateNoteModal } from "./create-note-modal";

interface TopToolbarProps {
  onCreateNote: (title: string, content: string) => void;
  onNewFolder: () => void;
  onToggleView: () => void;
  onToggleVault: () => void;
  viewMode: "editor" | "graph" | "vault";
  onNavigateToLanding?: () => void;
}

export function TopToolbar({
  onCreateNote,
  onNewFolder,
  onToggleView,
  onToggleVault,
  viewMode,
  onNavigateToLanding,
}: TopToolbarProps) {
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);

  return (
    <>
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
            onClick={() => setIsCreateNoteOpen(true)}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Note
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFileModalOpen(true)}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload File
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
            className={`h-8 px-2 ${
              viewMode === "graph"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Network className="h-4 w-4 mr-1" />
            Graph View
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVault}
            className={`h-8 px-2 ${
              viewMode === "vault"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="h-4 w-4 mr-1" />
            Vault Store
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="w-64 h-8 pl-7 bg-muted/50 border-0 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <UploadFileModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onSuccess={(fileId) => {
          console.log("File uploaded successfully:", fileId);
          // You can add logic here to refresh the file list or show success message
        }}
      />

      <CreateNoteModal
        isOpen={isCreateNoteOpen}
        onClose={() => setIsCreateNoteOpen(false)}
        onSubmit={(title, content) => {
          onCreateNote(title, content);
          setIsCreateNoteOpen(false);
        }}
      />
    </>
  );
}
