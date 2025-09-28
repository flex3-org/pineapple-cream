# PineappleCream

A decentralized platform for secure file storage, knowledge management, and content sharing built on Sui blockchain with Walrus decentralized storage.

## What is PineappleCream?

PineappleCream is a **decentralized knowledge management platform** that revolutionizes how users store, organize, and share their digital content. Built on blockchain technology, it provides true ownership of data while offering intelligent organization and privacy-first features.

The platform combines the security of blockchain verification with the efficiency of decentralized storage, creating a censorship-resistant system where users maintain complete control over their files, documents, images, and notes.

## Core Features

### 🔒 **Decentralized Storage**
- Upload any file type to Walrus decentralized storage network
- Blockchain-verified ownership and metadata tracking
- CDN-based downloads for optimal performance
- No central servers - truly decentralized architecture

### 📝 **Smart Note-Taking**
- Rich markdown-based editor with real-time editing
- Tab-based interface for managing multiple notes
- Automatic content analysis and tagging
- Visual knowledge graph showing content relationships

### 🤖 **AI-Powered Organization**
- Automatic file categorization and tagging using KeyBERT
- Smart content analysis for weaknesses, strengths, and improvements
- Dynamic folder generation based on content types
- Intelligent content recommendations

### 🔐 **Privacy & Security**
- Zero-knowledge privacy with optional encryption
- Blockchain-based ownership verification
- Access control with smart contract permissions
- Planned temporary sharing features for one-time viewing

### 🏷️ **Smart Auto-Tagging & Organization**
- Automatic content analysis and intelligent tagging for all documents
- AI-powered categorization based on content type, topics, and context
- Smart folder generation and content grouping
- Quick access to relevant data through tag-based filtering and search

## Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Sui dApp Kit** for blockchain integration
- **React Router** for navigation

### **Blockchain & Storage**
- **Sui Blockchain** for smart contracts and ownership verification
- **Move Language** for smart contract development
- **Walrus** decentralized storage network for file content
- **CDN Integration** for efficient file delivery

### **AI Services**
- **FastAPI** backend for text analysis
- **KeyBERT** for automatic keyword extraction and tagging
- **Ollama** integration for advanced text analysis

## Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **pnpm** or npm package manager
- **Sui CLI** for blockchain interactions
- **Python 3.8+** for AI services
- **Ollama** (optional, for advanced AI features)

### Installation

1. **Clone the Repository**
```bash
git clone <repository-url>
cd notes-app
```

2. **Install Dependencies**
```bash
# Install frontend dependencies
npm install
```

3. **And Finally...**
```bash
# Install frontend dependencies
npm run dev
```

## Usage Guide

### 🔗 **Connect Wallet**
1. Open the application in your browser
2. Click "Connect Wallet" and select your Sui wallet
3. Approve the connection to access the dashboard

### 📤 **Upload Files**
1. Click "Upload File" in the toolbar
2. Select your file and provide a filename
3. Monitor upload progress as the file is uploaded to Walrus storage
4. File metadata is automatically registered on Sui blockchain

### 📝 **Create Notes**
1. Click "New Note" to create a markdown note
2. Use the rich text editor with markdown support
3. Notes are automatically saved and tagged using AI
4. Switch between multiple notes using the tab interface

### 🗂️ **Organize Content**
1. Files and notes are automatically categorized into folders
2. Use the graph view to visualize relationships between content
3. Search and filter by tags, file types, or content
4. Drag and drop files for quick organization

### 📥 **Download Files**
1. Click the download button on any file card
2. Files are retrieved directly from Walrus CDN
3. Original filenames and metadata are preserved
4. Download progress is shown in real-time

### 🏷️ **Smart Organization**
1. Documents are automatically analyzed and tagged using AI
2. Tags help categorize content by topic, type, and relevance
3. Use tag-based filtering to quickly find relevant documents
4. Smart folders automatically organize content for easy access

## Project Structure

```
notes-app/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components (Radix-based)
│   │   ├── notes-app.tsx   # Main application component
│   │   ├── upload-file-modal.tsx  # File upload interface
│   │   ├── smart-organizer.tsx  # AI-powered content organization
│   │   ├── vault-store.tsx # Vault management interface
│   │   ├── left-sidebar.tsx # Navigation sidebar
│   │   ├── center-editor.tsx # Main editor interface
│   │   └── right-sidebar.tsx # Content metadata panel
│   ├── lib/                # Utility functions
│   │   ├── utils.ts        # General utilities
│   │   └── walrus.ts       # Walrus storage integration
│   ├── hooks/              # Custom React hooks
│   ├── constants.ts        # Application constants
│   ├── networkConfig.ts    # Blockchain network configuration
│   └── main.tsx           # Application entry point
├── move/
│   └── vault.move         # Sui Move smart contracts
├── api/
│   └── main.py           # FastAPI backend for AI services
├── public/               # Static assets
├── dist/                 # Build output
└── package.json          # Dependencies and scripts
```

## Smart Contracts

### **VaultStore Contract**
The central smart contract that manages all file and note uploads:

```move
struct VaultStore has key {
    id: UID,
    admin: address,
    files: vector<ID>,      // File object IDs
    notes: vector<ID>,      // Note object IDs
    total_files: u64,
    total_notes: u64,
}
```

**Key Functions:**
- `upload_file_entry()` - Register new files on blockchain
- `upload_note_entry()` - Register new notes on blockchain
- `get_vault_stats()` - Retrieve platform statistics
- `is_vault_admin()` - Admin access control

### **UserFile Contract**
Individual file objects with comprehensive metadata:

```move
struct UserFile has key, store {
    id: UID,
    owner: address,
    walrus_blob_id: String,        // Walrus storage reference
    metadata: FileMetadata,        // File details
    enhanced_metadata: String,     // JSON metadata
    secondary_blob_id: String,     // For partial encryption
    seal_encryption_id: String,    // Encryption keys
}
```

**Key Functions:**
- `verify_file_ownership()` - Ownership verification
- `get_file_info()` - Retrieve file metadata
- `transfer_file()` - Transfer ownership
- `seal_approve_file_access()` - Access control for encrypted files

### **UserNote Contract**
Note objects with content management:

```move
struct UserNote has key, store {
    id: UID,
    owner: address,
    content_blob_id: String,        // Content storage reference
    metadata: NoteMetadata,        // Note details
    enhanced_metadata: String,     // JSON metadata
    secondary_blob_id: String,     // For partial encryption
    seal_encryption_id: String,    // Encryption keys
}
```

**Key Functions:**
- `verify_note_ownership()` - Ownership verification
- `get_note_info()` - Retrieve note metadata
- `transfer_note()` - Transfer ownership
- `seal_approve_note_access()` - Access control for encrypted notes

### **Security Features**
- **Ownership Verification**: Blockchain-based proof of ownership
- **Access Control**: Smart contract permissions for encrypted content
- **Transfer Capabilities**: Secure ownership transfer between users
- **Metadata Integrity**: Immutable file and note metadata on blockchain

## Future Vision

### **Phase 1: Enhanced AI Integration** 🧠
- **Advanced Auto-Tagging**: More sophisticated content analysis and tagging algorithms
- **Smart Recommendations**: AI-powered content suggestions based on tags and patterns
- **Automated Summarization**: Automatic content summarization and key point extraction
- **Multi-language Support**: AI translation and analysis across languages

### **Phase 2: Collaboration Features** 👥
- **Team Workspaces**: Shared vaults for collaborative projects
- **Real-time Collaboration**: Live editing and commenting on shared content
- **Permission Management**: Granular access controls for team members
- **Version Control**: Track changes and maintain content history

### **Phase 3: Advanced Sharing** 🔗
- **Temporary Access Links**: One-time viewing links with expiration
- **Public Knowledge Base**: Option to publish content publicly
- **Content Monetization**: Token-based access to premium content
- **Cross-platform Integration**: API for third-party applications

### **Phase 4: Ecosystem Expansion** 🌐
- **Plugin System**: Extensible architecture for custom functionality
- **Mobile Applications**: Native iOS and Android apps
- **Enterprise Features**: Advanced security and compliance tools
- **Decentralized Marketplace**: Community-driven content marketplace

### **Long-term Goals** 🚀
- **Web3 Integration**: Full decentralization with IPFS and other protocols
- **AI Agent Network**: Autonomous AI agents for content management
- **Cross-chain Compatibility**: Support for multiple blockchain networks
- **Global Knowledge Graph**: Connect with other decentralized knowledge platforms

---

**Built with ❤️ using Sui blockchain and Walrus decentralized storage**
