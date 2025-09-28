import { useState, useCallback, useEffect } from "react";
import { useSuiClientQuery, useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { LeftSidebar } from "./left-sidebar";
import { CenterEditor } from "./center-editor";
import { RightSidebar } from "./right-sidebar";
import { TopToolbar } from "./top-toolbar";
import { Loader2 } from "lucide-react";

interface VaultFileMetadata {
  original_filename: string;
  file_size: number;
  content_type: string;
  upload_timestamp: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  folderId?: string;
  tags: string[];
  isFile?: boolean;
  fileExtension?: string;
  secondary_blob_id?: string;
  file_metadata?: VaultFileMetadata;
  owner?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  children: string[];
}

export interface Tab {
  id: string;
  noteId: string;
  title: string;
  isActive: boolean;
  isDirty: boolean;
}

export function NotesApp() {
  const vaultStoreObjectId = useNetworkVariable("vaultStoreObjectId");
  const currentAccount = useCurrentAccount();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNote, setLoadingNote] = useState(false);
  const [allObjectIds, setAllObjectIds] = useState<string[]>([]);

  // Query vault store object from the blockchain
  const { data: vaultStoreData } = useSuiClientQuery(
    "getObject",
    {
      id: vaultStoreObjectId,
      options: {
        showContent: true,
      },
    },
    {
      enabled: !!vaultStoreObjectId,
    }
  );

  // Extract file and note IDs from vault store data
  useEffect(() => {
    if (
      vaultStoreData?.data?.content &&
      "fields" in vaultStoreData.data.content
    ) {
      const fields = vaultStoreData.data.content.fields as any;
      const files = fields.files || [];
      const notes = fields.notes || [];

      // Combine files and notes arrays
      const combinedIds = [...files, ...notes];
      console.log("Combined object IDs from vault store:", combinedIds);
      setAllObjectIds(combinedIds);
    }
  }, [vaultStoreData]);

  // Fetch all objects (files and notes) using multiGetObjects
  const { data: allVaultObjects, isLoading: isLoadingAll } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: allObjectIds,
      options: {
        showContent: true,
        showDisplay: true,
        showType: true,
      },
    },
    {
      enabled: allObjectIds.length > 0,
    }
  );

  // Function to fetch content from CDN
  const fetchContentFromCDN = async (
    secondary_blob_id: string
  ): Promise<string> => {
    if (!secondary_blob_id || secondary_blob_id.startsWith("walrus_")) {
      return "";
    }

    try {
      const AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";
      const CDNLink = `${AGGREGATOR_URL}/v1/blobs/by-quilt-patch-id/${secondary_blob_id}`;

      const response = await fetch(CDNLink);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const content = await response.text();
      return content;
    } catch (error) {
      console.error("Failed to fetch content from CDN:", error);
      return "";
    }
  };

  // Helper function to get file extension from filename or content type
  const getFileExtension = (
    filename?: string,
    contentType?: string
  ): string => {
    if (filename) {
      const ext = filename.split(".").pop()?.toLowerCase();
      if (ext) return ext;
    }

    if (contentType) {
      const typeMap: { [key: string]: string } = {
        "application/pdf": "pdf",
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "text/plain": "txt",
        "application/json": "json",
        "text/markdown": "md",
      };
      return typeMap[contentType] || "bin";
    }

    return "bin";
  };

  // Helper function to extract first three letters from content for heading
  const extractHeadingFromContent = (content: string): string => {
    if (!content) return "Untitled";

    // Remove markdown syntax and get clean text
    const cleanText = content
      .replace(/#{1,6}\s+/g, "") // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
      .replace(/\*(.*?)\*/g, "$1") // Remove italic markdown
      .replace(/`(.*?)`/g, "$1") // Remove inline code
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links, keep text
      .replace(/^\s*[-*+]\s+/gm, "") // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, "") // Remove numbered list markers
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    // Get first three meaningful characters (letters/numbers)
    const firstThreeLetters = cleanText
      .split("")
      .filter((char) => /[a-zA-Z0-9]/.test(char))
      .slice(0, 3)
      .join("")
      .toUpperCase();

    return firstThreeLetters || "UNT";
  };

  // Process vault objects and convert to notes
  useEffect(() => {
    const processVaultEntries = async (objects: any[]) => {
      if (!objects || objects.length === 0) {
        setLoading(false);
        return;
      }

      const processedNotes: Note[] = [];

      for (const obj of objects) {
        const content = obj.data?.content;
        if (!content || !content.fields) continue;

        const fields = content.fields;
        const isNote = obj.data.content.type.includes("::vault::UserNote");

        // Extract enhanced metadata if available
        let enhancedMeta: any = {};
        if (fields.enhanced_metadata) {
          try {
            const parsed = JSON.parse(fields.enhanced_metadata);
            enhancedMeta = parsed.originalFile || {};
          } catch (error) {
            console.warn("Failed to parse enhanced metadata:", error);
          }
        }

        // Extract file metadata
        let fileMetadata: VaultFileMetadata | undefined;
        if (fields.metadata?.fields) {
          const meta = fields.metadata.fields;
          fileMetadata = {
            original_filename: Array.isArray(meta.original_filename)
              ? new TextDecoder().decode(new Uint8Array(meta.original_filename))
              : meta.original_filename || "",
            file_size: parseInt(meta.file_size) || 0,
            content_type: Array.isArray(meta.content_type)
              ? new TextDecoder().decode(new Uint8Array(meta.content_type))
              : meta.content_type || "",
            upload_timestamp: parseInt(meta.upload_timestamp) || 0,
          };
        }

        const secondary_blob_id = fields.secondary_blob_id || "";

        let noteContent = "";

        if (isNote && secondary_blob_id) {
          // For notes, fetch content from CDN
          noteContent = await fetchContentFromCDN(secondary_blob_id);
        } else if (!isNote) {
          // For files, create a display content showing file info
          const fileExt = getFileExtension(
            fileMetadata?.original_filename,
            fileMetadata?.content_type
          );
          const fileSize = fileMetadata?.file_size
            ? (fileMetadata.file_size / 1024 / 1024).toFixed(2) + " MB"
            : "Unknown size";
          const fileName =
            enhancedMeta.name ||
            fileMetadata?.original_filename ||
            "Untitled File";

          noteContent = `# ${fileName}\n\n**File Type**: ${fileExt.toUpperCase()} File\n**Size**: ${fileSize}\n**Content Type**: ${
            fileMetadata?.content_type || "Unknown"
          }\n\n---\n\n*This is a file stored on the blockchain. Use the download button to access the file content.*`;
        }

        // Extract title from content for notes, use original name for files
        const title = isNote
          ? extractHeadingFromContent(noteContent)
          : enhancedMeta.name || fileMetadata?.original_filename || "UNT";

        const note: Note = {
          id: obj.data.objectId,
          title,
          content: noteContent,
          createdAt: new Date(fileMetadata?.upload_timestamp || Date.now()),
          updatedAt: new Date(fileMetadata?.upload_timestamp || Date.now()),
          tags: isNote ? ["note", "blockchain"] : ["file", "blockchain"],
          isFile: !isNote,
          fileExtension: !isNote
            ? getFileExtension(
                fileMetadata?.original_filename,
                fileMetadata?.content_type
              )
            : undefined,
          secondary_blob_id,
          file_metadata: fileMetadata,
          owner: fields.owner || "Unknown",
        };

        // Only add notes owned by the current user
        if (
          currentAccount?.address &&
          note.owner &&
          note.owner.toLowerCase() === currentAccount.address.toLowerCase()
        ) {
          processedNotes.push(note);
        }
      }

      setNotes(processedNotes);
      setLoading(false);
    };

    if (
      allVaultObjects &&
      Array.isArray(allVaultObjects) &&
      allVaultObjects.length > 0
    ) {
      processVaultEntries(allVaultObjects);
    } else if (!isLoadingAll && allObjectIds.length > 0) {
      setLoading(false);
    } else if (!isLoadingAll && allObjectIds.length === 0) {
      setLoading(false);
    }
  }, [allVaultObjects, allObjectIds, isLoadingAll]);

  // Create dynamic folders based on note types
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    if (notes.length > 0) {
      const fileNotes = notes.filter((note) => note.isFile);
      const textNotes = notes.filter((note) => !note.isFile);

      const newFolders: Folder[] = [];

      if (textNotes.length > 0) {
        newFolders.push({
          id: "notes",
          name: "Notes",
          children: textNotes.map((note) => note.id),
        });
      }

      if (fileNotes.length > 0) {
        newFolders.push({
          id: "files",
          name: "Files",
          children: fileNotes.map((note) => note.id),
        });
      }

      setFolders(newFolders);
    }
  }, [notes]);

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"editor" | "graph">("editor");

  const handleTabSelect = useCallback((tabId: string) => {
    setLoadingNote(true);
    setTimeout(() => {
      setActiveTabId(tabId);
      setLoadingNote(false);
    }, 200);
  }, []);

  const activeNote = activeTabId
    ? notes.find(
        (note) => tabs.find((tab) => tab.id === activeTabId)?.noteId === note.id
      ) || null
    : null;

  const openNote = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;

      // Check if note is already open in a tab
      const existingTab = tabs.find((tab) => tab.noteId === noteId);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return;
      }

      // Show loading state when opening a new note
      setLoadingNote(true);

      // Simulate loading delay for better UX
      setTimeout(() => {
        // Create new tab
        const newTab: Tab = {
          id: `tab-${Date.now()}`,
          noteId,
          title: note.title,
          isActive: true,
          isDirty: false,
        };

        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
        setLoadingNote(false);
      }, 300);
    },
    [notes, tabs]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
      setActiveTabId((currentActiveId) => {
        if (currentActiveId === tabId) {
          const remainingTabs = tabs.filter((tab) => tab.id !== tabId);
          return remainingTabs.length > 0
            ? remainingTabs[remainingTabs.length - 1].id
            : null;
        }
        return currentActiveId;
      });
    },
    [tabs]
  );

  const createNewNote = useCallback(
    (title: string, content: string) => {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        title: title || "Untitled Note",
        content: content || "# Untitled Note\n\nStart writing...",
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };

      setNotes((prev) => [newNote, ...prev]);
      openNote(newNote.id);
    },
    [openNote]
  );

  // No updateNoteContent needed since everything is view-only

  const createNewFolder = useCallback(() => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: "New Folder",
      children: [],
    };

    setFolders((prev) => [...prev, newFolder]);
  }, []);

  // Function to download file via CDN
  const downloadFile = async (secondary_blob_id: string, fileName: string) => {
    if (!secondary_blob_id || secondary_blob_id.startsWith("walrus_")) {
      alert("No file available for download");
      return;
    }

    try {
      const AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";
      const CDNLink = `${AGGREGATOR_URL}/v1/blobs/by-quilt-patch-id/${secondary_blob_id}`;

      const link = document.createElement("a");
      link.href = CDNLink;
      link.download = fileName;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col dark">
      <TopToolbar
        onCreateNote={createNewNote}
        onNewFolder={createNewFolder}
        onToggleView={() =>
          setViewMode((prev) => (prev === "editor" ? "graph" : "editor"))
        }
        viewMode={viewMode}
      />

      <div className="flex-1 flex min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Loading your notes...
              </h2>
              <p className="text-muted-foreground">
                Fetching data from blockchain
              </p>
            </div>
          </div>
        ) : (
          <>
            <LeftSidebar
              notes={notes}
              folders={folders}
              onNoteSelect={openNote}
              downloadFile={downloadFile}
              isLoading={loading}
            />

            <CenterEditor
              tabs={tabs}
              activeTabId={activeTabId}
              activeNote={activeNote}
              onTabSelect={handleTabSelect}
              onTabClose={closeTab}
              viewMode={viewMode}
              notes={notes}
              downloadFile={downloadFile}
              isLoadingNote={loadingNote}
            />

            <RightSidebar
              activeNote={activeNote}
              chatContext={{
                conversationId: `conv_${Date.now()}`,
                topic: activeNote?.title || "General Discussion",
                messages: [
                  {
                    role: "user",
                    content: `Analyzing content: ${
                      activeNote?.title || "Untitled"
                    }`,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
