import { useState, useCallback } from "react";
import { LeftSidebar } from "./left-sidebar";
import { CenterEditor } from "./center-editor";
import { RightSidebar } from "./right-sidebar";
import { TopToolbar } from "./top-toolbar";
import { VaultStore } from "./vault-store";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  folderId?: string;
  tags: string[];
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

interface NotesAppProps {
  onNavigateToLanding?: () => void;
}

export function NotesApp({ onNavigateToLanding }: NotesAppProps) {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "blockchain-1",
      title: "📁 My Blockchain Files",
      content:
        "# Blockchain Files\n\n## Uploaded Files\n\n### 📄 Project Documentation.pdf\n- **Size**: 2.3 MB\n- **Uploaded**: 2024-12-15\n- **Blob ID**: dummy_blob_1734567890_abc123\n- **Status**: ✅ Verified on Sui blockchain\n\n### 🖼️ Design Assets.zip\n- **Size**: 15.7 MB\n- **Uploaded**: 2024-12-14\n- **Blob ID**: dummy_blob_1734481490_def456\n- **Status**: ✅ Verified on Sui blockchain\n\n### 📊 Financial Report Q4.xlsx\n- **Size**: 856 KB\n- **Uploaded**: 2024-12-13\n- **Blob ID**: dummy_blob_1734395090_ghi789\n- **Status**: ✅ Verified on Sui blockchain\n\n---\n\n*All files are encrypted and stored on decentralized Walrus storage, accessible only by your wallet address.*",
      createdAt: new Date("2024-12-15"),
      updatedAt: new Date("2024-12-15"),
      tags: ["blockchain", "files", "storage"],
    },
    {
      id: "blockchain-2",
      title: "🔐 Blockchain Notes",
      content:
        "# Blockchain Notes Collection\n\n## Recent Notes\n\n### 📝 Meeting Notes - Blockchain Integration\n- **Created**: 2024-12-15\n- **Content Size**: 1,247 characters\n- **Blob ID**: dummy_note_1734567890_xyz123\n- **Status**: ✅ Stored on blockchain\n\n### 💡 Ideas for DApp Development\n- **Created**: 2024-12-14\n- **Content Size**: 892 characters\n- **Blob ID**: dummy_note_1734481490_uvw456\n- **Status**: ✅ Stored on blockchain\n\n### 🚀 Sui Network Research\n- **Created**: 2024-12-13\n- **Content Size**: 2,156 characters\n- **Blob ID**: dummy_note_1734395090_rst789\n- **Status**: ✅ Stored on blockchain\n\n---\n\n*These notes are permanently stored on the Sui blockchain with Walrus decentralized storage. Only you can access them with your connected wallet.*",
      createdAt: new Date("2024-12-15"),
      updatedAt: new Date("2024-12-15"),
      tags: ["blockchain", "notes", "decentralized"],
    },
    {
      id: "1",
      title: "2024-08-22",
      content:
        "# Daily Notes\n\nToday I worked on the new project architecture. Key decisions:\n\n- Chose Next.js for the frontend framework\n- Implemented a three-panel layout similar to Obsidian\n- Added dark theme support with modern design tokens\n\nNext steps:\n- Add real-time collaboration features\n- Implement better search functionality",
      createdAt: new Date("2024-08-22"),
      updatedAt: new Date("2024-08-22"),
      tags: ["daily", "architecture"],
    },
    {
      id: "2",
      title: "2024-08-29",
      content:
        "# Meeting Notes - Q4 Planning\n\nDiscussed the roadmap for Q4 with the team:\n\n## Key Priorities\n1. User experience improvements\n2. Performance optimizations\n3. Mobile responsiveness\n\n## Action Items\n- [ ] Create wireframes for mobile layout\n- [ ] Research graph visualization libraries\n- [ ] Plan user testing sessions",
      createdAt: new Date("2024-08-29"),
      updatedAt: new Date("2024-08-29"),
      tags: ["meeting", "planning"],
    },
    {
      id: "3",
      title: "Book Notes on Elon Musk",
      content:
        '# Book Notes: Elon Musk Biography\n\n## Key Insights\n\n### Innovation Mindset\n- First principles thinking approach\n- Willingness to challenge conventional wisdom\n- Focus on solving fundamental problems\n\n### Risk Taking\n- Calculated risks with high potential impact\n- Learning from failures quickly\n- Persistence through setbacks\n\n### Leadership Style\n- Hands-on involvement in technical details\n- Setting ambitious goals and timelines\n- Building strong engineering cultures\n\n## Quotes\n> "When something is important enough, you do it even if the odds are not in your favor."\n\n## Related Topics\n- [[Exploring Starlink in Space]]\n- [[Research Notes - Starlink]]',
      createdAt: new Date("2024-08-20"),
      updatedAt: new Date("2024-08-20"),
      tags: ["book", "biography", "leadership"],
    },
    {
      id: "4",
      title: "Exploring Starlink in Space",
      content:
        "# Starlink Research\n\n## Technical Overview\n\nStarlink is a satellite constellation providing global internet coverage.\n\n### Key Technologies\n- Low Earth Orbit (LEO) satellites\n- Phased array antennas\n- Inter-satellite laser links\n- Advanced beamforming\n\n### Network Architecture\n- Ground stations for internet backbone connection\n- Satellite-to-satellite communication\n- User terminals (dishes) for end-user connectivity\n\n### Advantages\n- Lower latency than traditional satellite internet\n- Global coverage including remote areas\n- Scalable constellation design\n\n## Market Impact\n- Disrupting traditional ISP models\n- Enabling internet access in underserved regions\n- Supporting emergency communications\n\n## References\n- [[Book Notes on Elon Musk]]\n- [[Research Notes - Starlink]]",
      createdAt: new Date("2024-08-18"),
      updatedAt: new Date("2024-08-18"),
      tags: ["research", "space", "technology"],
    },
    {
      id: "5",
      title: "Research Notes - Starlink",
      content:
        "# Starlink Deep Dive\n\nContinued research on satellite technology and its implications.\n\n## Technical Specifications\n\n### Satellite Details\n- Mass: ~260 kg per satellite\n- Altitude: 550 km (initial constellation)\n- Orbital inclination: 53°\n- Propulsion: Krypton ion thrusters\n\n### Performance Metrics\n- Latency: 20-40ms\n- Download speeds: 50-200 Mbps\n- Upload speeds: 10-20 Mbps\n- Coverage: 99% of populated areas\n\n## Deployment Timeline\n- 2019: First operational satellites\n- 2020: Beta testing begins\n- 2021: Public service launch\n- 2024: 5000+ satellites deployed\n\n## Challenges\n- Space debris concerns\n- Regulatory approvals\n- Ground infrastructure scaling\n- Competition from other constellations\n\n## Future Developments\n- Starship integration for launches\n- Inter-satellite laser links\n- Mobile connectivity partnerships\n- Mars communication network\n\nSee also: [[Exploring Starlink in Space]]",
      createdAt: new Date("2024-08-15"),
      updatedAt: new Date("2024-08-15"),
      tags: ["research", "technology", "satellites"],
    },
  ]);

  const [folders, setFolders] = useState<Folder[]>([
    {
      id: "blockchain",
      name: "🔗 Blockchain Storage",
      children: ["blockchain-1", "blockchain-2"],
    },
    {
      id: "daily",
      name: "Daily Notes",
      children: ["1", "2"],
    },
    {
      id: "research",
      name: "Research",
      children: ["4", "5"],
    },
  ]);

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"editor" | "graph" | "vault">("editor");

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

  const createNewNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "Untitled Note",
      content: "# Untitled Note\n\nStart writing...",
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    };

    setNotes((prev) => [newNote, ...prev]);
    openNote(newNote.id);
  }, [openNote]);

  const updateNoteContent = useCallback(
    (noteId: string, content: string, title?: string) => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? {
                ...note,
                content,
                title: title || note.title,
                updatedAt: new Date(),
              }
            : note
        )
      );

      // Mark tab as dirty
      setTabs((prev) =>
        prev.map((tab) =>
          tab.noteId === noteId
            ? { ...tab, isDirty: true, title: title || tab.title }
            : tab
        )
      );
    },
    []
  );

  const createNewFolder = useCallback(() => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: "New Folder",
      children: [],
    };

    setFolders((prev) => [...prev, newFolder]);
  }, []);

  const toggleVaultView = useCallback(() => {
    setViewMode((prev) => (prev === "vault" ? "editor" : "vault"));
  }, []);

  return (
    <div className="h-screen bg-background text-foreground flex flex-col dark">
      <TopToolbar
        onNewNote={createNewNote}
        onNewFolder={createNewFolder}
        onToggleView={() =>
          setViewMode((prev) => (prev === "editor" ? "graph" : "editor"))
        }
        onToggleVault={toggleVaultView}
        viewMode={viewMode}
        onNavigateToLanding={onNavigateToLanding}
      />

      <div className="flex-1 flex overflow-hidden">
        {viewMode === "vault" ? (
          <div className="flex-1 p-6 overflow-auto">
            <VaultStore />
          </div>
        ) : (
          <>
            <LeftSidebar notes={notes} folders={folders} onNoteSelect={openNote} />

            <CenterEditor
              tabs={tabs}
              activeTabId={activeTabId}
              activeNote={activeNote}
              onTabSelect={setActiveTabId}
              onTabClose={closeTab}
              onNoteUpdate={updateNoteContent}
              viewMode={viewMode}
              notes={notes}
            />

            <RightSidebar activeNote={activeNote} allNotes={notes} />
          </>
        )}
      </div>
    </div>
  );
}
