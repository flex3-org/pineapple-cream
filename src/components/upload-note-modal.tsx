import { useState } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import { useNetworkVariable } from "../networkConfig";
import { toast } from "sonner";
import { FileText, PenTool } from "lucide-react";

interface NoteMetadata {
  title: string;
  content: string;
}

interface UploadNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (noteId: string) => void;
}

export function UploadNoteModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadNoteModalProps) {
  console.log("UploadNoteModal rendered with isOpen:", isOpen);
  const currentAccount = useCurrentAccount();
  const vaultPackageId = useNetworkVariable("vaultPackageId");
  const vaultStoreObjectId = useNetworkVariable("vaultStoreObjectId");

  const [metadata, setMetadata] = useState<NoteMetadata>({
    title: "",
    content: "",
  });

  const [uploadProgress, setUploadProgress] = useState<{
    step: string;
    progress: number;
    isUploading: boolean;
    error?: string;
    success?: boolean;
  }>({
    step: "Ready to upload",
    progress: 0,
    isUploading: false,
  });

  const { mutate: signAndExecute, isPending: isTransactionPending } =
    useSignAndExecuteTransaction();

  const handleMetadataChange =
    (field: keyof NoteMetadata) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setMetadata((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleUploadNote = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!metadata.title || !metadata.content) {
      toast.error("Please fill in all fields");
      return;
    }

    // Check if we have valid contract addresses
    if (vaultPackageId === "0xTODO" || vaultStoreObjectId === "0xTODO") {
      toast.error(
        "Contract not deployed. Please update the package/object IDs in constants.ts"
      );
      return;
    }

    try {
      setUploadProgress({
        step: "Step 1/3: Processing note...",
        progress: 33,
        isUploading: true,
      });

      // Generate dummy Walrus blob ID for testing
      const dummyContentBlobId = `dummy_note_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;

      setUploadProgress({
        step: "Step 2/3: Uploading to storage...",
        progress: 66,
        isUploading: true,
      });

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUploadProgress({
        step: "Step 3/3: Registering on blockchain...",
        progress: 90,
        isUploading: true,
      });

      // Create transaction to call vault contract
      const tx = new Transaction();

      const contentSize = new TextEncoder().encode(metadata.content).length;

      tx.moveCall({
        target: `${vaultPackageId}::vault::upload_note_entry`,
        arguments: [
          tx.object(vaultStoreObjectId), // VaultStore shared object ID
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(dummyContentBlobId))
          ),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(metadata.title))
          ),
          tx.pure.u64(contentSize),
          tx.pure.vector("u8", Array.from(new TextEncoder().encode("{}"))), // enhanced_metadata
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(""))), // secondary_blob_id
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(""))), // seal_encryption_id
        ],
      });

      console.log(`✍️ Signing note upload transaction...`);
      const uploadResult = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: tx as unknown as string },
          {
            onSuccess: (result) => {
              console.log(`✅ Note uploaded successfully:`, result.digest);
              resolve(result);
            },
            onError: (error) => {
              console.error(`❌ Note upload failed:`, error);
              reject(error);
            },
          }
        );
      });

      setUploadProgress({
        step: "Note uploaded successfully!",
        progress: 100,
        isUploading: false,
        success: true,
      });

      toast.success("🎉 Note uploaded successfully!");

      // Reset form
      setMetadata({
        title: "",
        content: "",
      });

      // Call success callback
      onSuccess?.(uploadResult.digest);

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setUploadProgress({
          step: "Ready to upload",
          progress: 0,
          isUploading: false,
        });
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setUploadProgress({
        step: "Upload failed",
        progress: 0,
        isUploading: false,
        error: errorMessage,
      });
      toast.error(`Upload failed: ${errorMessage}`);
    }
  };

  const isFormValid = metadata.title && metadata.content;

  const handleClose = () => {
    if (!uploadProgress.isUploading) {
      onClose();
      // Reset form
      setMetadata({
        title: "",
        content: "",
      });
      setUploadProgress({
        step: "Ready to upload",
        progress: 0,
        isUploading: false,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="sm:max-w-[600px] bg-gray-900 border-gray-700 border rounded-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-2 text-center sm:text-left mb-4 relative">
          <button
            onClick={handleClose}
            className="absolute top-0 right-0 text-gray-400 hover:text-white"
            disabled={uploadProgress.isUploading}
          >
            ✕
          </button>
          <h2 className="flex items-center gap-2 text-white text-lg font-semibold">
            <PenTool className="h-5 w-5 text-green-500" />
            Create Note on Blockchain
          </h2>
          <p className="text-gray-400 text-sm">
            Create and store your note on decentralized storage with blockchain
            verification.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Note Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter note title"
              value={metadata.title}
              onChange={handleMetadataChange("title")}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-white">
              Note Content *
            </Label>
            <Textarea
              id="content"
              placeholder="Write your note here..."
              value={metadata.content}
              onChange={handleMetadataChange("content")}
              rows={8}
              className="bg-gray-800 border-gray-600 text-white resize-none"
            />
            <p className="text-sm text-gray-400">
              Characters: {metadata.content.length}
            </p>
          </div>

          {/* Upload Progress */}
          {(uploadProgress.isUploading ||
            uploadProgress.error ||
            uploadProgress.success) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">
                {uploadProgress.step}
              </p>

              {uploadProgress.isUploading && (
                <Progress value={uploadProgress.progress} className="w-full" />
              )}

              {uploadProgress.error && (
                <div className="p-3 bg-red-900/20 border border-red-700 rounded-md">
                  <p className="text-sm text-red-400">{uploadProgress.error}</p>
                </div>
              )}

              {uploadProgress.success && (
                <div className="p-3 bg-green-900/20 border border-green-700 rounded-md">
                  <p className="text-sm text-green-400">
                    🎉 Your note has been uploaded successfully!
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploadProgress.isUploading}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadNote}
              disabled={
                !isFormValid ||
                uploadProgress.isUploading ||
                isTransactionPending
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {uploadProgress.isUploading || isTransactionPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Note
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            * Your note will be uploaded to decentralized storage and registered
            on Sui blockchain. The note will be owned by your wallet address and
            only you can access it.
          </p>
        </div>
      </div>
    </div>
  );
}
