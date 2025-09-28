# PineappleCream

A decentralized platform for secure file storage, knowledge management, and content sharing built on Sui blockchain with Walrus decentralized storage.

## What PineappleCream Does

PineappleCream is a **decentralized knowledge management platform** that allows users to:

- **Upload & Store Files**: Securely store documents, images, videos, and any file type on decentralized storage
- **Create & Manage Notes**: Rich markdown-based note-taking with real-time editing
- **Smart Organization**: Automatic tagging and categorization of content using AI
- **Secure Sharing**: Blockchain-verified ownership with planned temporary access features
- **Visual Knowledge Graph**: Interactive graph view showing relationships between your content
- **Privacy-First**: Zero-knowledge privacy with encrypted storage options

## Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Sui dApp Kit** for blockchain integration
- **React Router** for navigation

### Blockchain & Storage
- **Sui Blockchain** for smart contracts and ownership verification
- **Move Language** for smart contract development
- **Walrus** decentralized storage network for file content
- **CDN Integration** for efficient file delivery

### Smart Contracts
- **VaultStore**: Central contract managing all uploads and metadata
- **UserFile/UserNote**: Individual file and note objects with ownership
- **Access Control**: Encryption and permission management functions

### AI Services
- **FastAPI** backend for text analysis
- **KeyBERT** for automatic keyword extraction and tagging
- **Ollama** integration for advanced text analysis (weakness, strength, improvements, recommendations)

## Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** or npm package manager
- **Sui CLI** for blockchain interactions
- **Python 3.8+** for AI services
- **Ollama** (optional, for advanced AI features)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd notes-app
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
pnpm install

# Install Python dependencies for AI services
cd api
pip install -r requirements.txt
cd ..
```

### 3. Configure Network Variables
Update `src/networkConfig.ts` with your deployed contract addresses:
```typescript
export const networkConfig = {
  vaultPackageId: "0xYOUR_PACKAGE_ID",
  vaultStoreObjectId: "0xYOUR_STORE_OBJECT_ID"
};
```

### 4. Deploy Smart Contracts (Optional)
```bash
# Deploy Move contracts to Sui testnet
sui move build
sui client publish --gas-budget 100000000
```

### 5. Start Development Servers

**Frontend (Main Application):**
```bash
pnpm dev
```

**AI Services (Optional):**
```bash
# Start Ollama server
ollama serve

# Start FastAPI backend
cd api
python main.py
```

## Usage

### 1. Connect Wallet
- Open the application in your browser
- Click "Connect Wallet" and select your Sui wallet
- Approve the connection

### 2. Upload Files
- Click "Upload File" in the toolbar
- Select your file and provide a filename
- The file will be uploaded to Walrus storage and registered on Sui blockchain
- Monitor upload progress in the modal

### 3. Create Notes
- Click "New Note" to create a markdown note
- Use the rich text editor with markdown support
- Notes are automatically saved and tagged

### 4. Organize Content
- Files and notes are automatically categorized into folders
- Use the graph view to see relationships between content
- Search and filter by tags, file types, or content

### 5. Download Files
- Click the download button on any file card
- Files are retrieved directly from Walrus CDN
- Original filenames and metadata are preserved

## API Endpoints

### Text Analysis API (`/api`)
- `POST /analyze` - Analyze text for weaknesses, strengths, improvements, and recommendations
- `POST /get_tag` - Extract keywords and generate tags for content
- `GET /` - Health check endpoint

## Project Structure

```
notes-app/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── notes-app.tsx   # Main application component
│   │   ├── upload-file-modal.tsx
│   │   ├── graph-view.tsx  # Knowledge graph visualization
│   │   └── ...
│   ├── lib/                # Utility functions
│   ├── hooks/              # Custom React hooks
│   └── main.tsx           # Application entry point
├── move/
│   └── vault.move         # Sui Move smart contracts
├── api/
│   └── main.py           # FastAPI backend for AI services
├── public/               # Static assets
└── dist/                 # Build output
```

## Key Features

### Decentralized Storage
- Files stored on Walrus network with blockchain verification
- CDN-based downloads for optimal performance
- Automatic metadata extraction and storage

### Smart Organization
- AI-powered content tagging using KeyBERT
- Automatic file type detection and categorization
- Visual graph showing content relationships

### Security & Privacy
- Blockchain-based ownership verification
- Optional encryption for sensitive content
- Zero-knowledge privacy features

### User Experience
- Modern dark theme interface
- Responsive design for all devices
- Real-time editing with tab management
- Drag-and-drop file uploads


---

**Built with ❤️ using Sui blockchain and Walrus decentralized storage**
