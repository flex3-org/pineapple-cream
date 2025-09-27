import { useState } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import { toast } from "sonner";
import { getWalrusClient } from "../lib/walrus";
import { WalrusFile } from "@mysten/walrus";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string) => void;
}

export function CreateNoteModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const currentAccount = useCurrentAccount();
  const vaultPackageId = useNetworkVariable("vaultPackageId");
  const vaultStoreObjectId = useNetworkVariable("vaultStoreObjectId");

  const { mutate: signAndExecute, isPending: isTransactionPending } =
    useSignAndExecuteTransaction();

  const [isUploading, setIsUploading] = useState(false);
  const [progressText, setProgressText] = useState("Ready to upload");

  // Walrus upload function for notes
  const uploadNoteToWalrus = async (
    title: string,
    content: string,
    retryCount: number = 0
  ): Promise<{ blobId: string; patchId: string; actualSize: number }> => {
    if (!currentAccount) {
      throw new Error("Wallet not connected");
    }

    const maxRetries = 3;
    const isRetry = retryCount > 0;

    try {
      console.log(
        `🚀 ${
          isRetry ? `[Retry ${retryCount}/${maxRetries}] ` : ""
        }Starting Walrus upload for note: ${title}`
      );

      // Create a text file from the note content
      const noteContent = `# ${title}\n\n${content}`;
      const noteFile = new File([noteContent], `${title}.md`, {
        type: "text/markdown",
      });

      // Create WalrusFile
      const walrusFile = WalrusFile.from({
        contents: noteFile,
        identifier: `${title}.md`,
        tags: {
          contentType: "text/markdown",
          noteTitle: title,
        },
      });

      console.log(`📦 Created WalrusFile for note: ${title}`, {
        fileName: `${title}.md`,
        fileSize: noteFile.size,
        fileType: "text/markdown",
      });

      // Get Walrus client and start upload flow
      console.log(`🔄 Initializing Walrus client...`);
      const walrusClient = await getWalrusClient();

      console.log(`🔄 Starting Walrus upload flow...`);
      const uploadStart = Date.now();

      const flow = walrusClient.writeFilesFlow({
        files: [walrusFile],
      });

      console.log(`📁 Encoding note for upload...`);
      await flow.encode();
      console.log(`✅ Encoding completed`);

      console.log(`📝 Creating register transaction...`);
      const registerTx = flow.register({
        epochs: 2, // Store for 2 epochs (~12 days)
        owner: currentAccount.address,
        deletable: false,
      });

      // Sign and execute the register transaction
      console.log(`✍️ Signing register transaction...`);
      const registerResult = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: registerTx },
          {
            onSuccess: (result) => {
              console.log(`✅ Space registered successfully:`, result.digest);
              resolve(result);
            },
            onError: (error) => {
              console.error(`❌ Space registration failed:`, error);
              reject(error);
            },
          }
        );
      });

      // Upload the data to storage nodes
      console.log(`☁️ Uploading note data to Walrus storage nodes...`);
      await flow.upload({
        digest: registerResult.digest,
      });

      // Create and execute the certify transaction
      console.log(`📋 Creating certify transaction...`);
      const certifyTx = flow.certify();

      await new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: certifyTx },
          {
            onSuccess: (result) => {
              console.log(`✅ Certify transaction successful:`, result.digest);
              resolve(result);
            },
            onError: (error) => {
              console.error(`❌ Certify transaction failed:`, error);
              reject(error);
            },
          }
        );
      });

      // Get the final blob ID
      const files = await flow.listFiles();
      if (files.length === 0) {
        throw new Error("No files were uploaded successfully");
      }

      const uploadedFile = files[0];
      const blobId = uploadedFile.blobId;
      const patchId = uploadedFile.id;

      console.log(`✅ Upload completed in ${Date.now() - uploadStart}ms`, {
        blobId,
        patchId,
        noteTitle: title,
        fileSize: noteFile.size,
      });

      return { blobId, patchId, actualSize: noteFile.size };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`💥 Walrus upload error for note ${title}:`, {
        error: errorMessage,
        retryCount,
        title,
      });

      // Check if this is a WASM-related error
      if (
        errorMessage.includes("WebAssembly") ||
        errorMessage.includes("magic word")
      ) {
        throw new Error(
          "Walrus WASM module failed to load. Please refresh the page and try again. If the issue persists, check your internet connection."
        );
      }

      // Check if this is a retryable error and we haven't exceeded max retries
      const isRetryableError =
        errorMessage.includes("400") ||
        errorMessage.includes("Bad Request") ||
        errorMessage.includes("network") ||
        errorMessage.includes("timeout");

      if (isRetryableError && retryCount < maxRetries) {
        console.log(
          `🔄 Retrying upload for note ${title} (attempt ${retryCount + 1}/${
            maxRetries + 1
          })`
        );
        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return uploadNoteToWalrus(title, content, retryCount + 1);
      }

      throw new Error(
        `Failed to upload note ${title} after ${
          retryCount + 1
        } attempts: ${errorMessage}`
      );
    }
  };

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  const handleCreate = async () => {
    if (!isValid) return;

    if (!currentAccount) {
      toast.error("Please connect your wallet");
      return;
    }

    if (vaultPackageId === "0xTODO" || vaultStoreObjectId === "0xTODO") {
      toast.error(
        "Contract not deployed. Please update the package/object IDs in constants.ts"
      );
      return;
    }

    try {
      setIsUploading(true);
      setProgressText("Step 1/3: Uploading note to Walrus...");

      // Upload note to Walrus
      const walrusResult = await uploadNoteToWalrus(title.trim(), content);

      setProgressText("Step 2/3: Registering on blockchain...");

      // Prepare enhanced metadata
      const enhancedMetadata = {
        originalNote: {
          title: title.trim(),
          contentLength: content.length,
          type: "text/markdown",
          patchId: walrusResult.patchId,
          blobId: walrusResult.blobId,
          isEncrypted: false,
        },
      };

      const tx = new Transaction();
      const contentSize = new TextEncoder().encode(content).length;

      tx.moveCall({
        target: `${vaultPackageId}::vault::upload_note_entry`,
        arguments: [
          tx.object(vaultStoreObjectId),
          tx.pure.address(currentAccount.address),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(walrusResult.blobId))
          ),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(title.trim()))
          ),
          tx.pure.u64(contentSize),
          tx.pure.vector(
            "u8",
            Array.from(
              new TextEncoder().encode(JSON.stringify(enhancedMetadata))
            )
          ), // enhanced_metadata
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(walrusResult.patchId))
          ), // secondary_blob_id (patchId for downloading)
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(""))), // seal_encryption_id (empty since no encryption)
        ],
      });

      setProgressText("Step 3/3: Finalizing...");

      await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: tx as unknown as string },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          }
        );
      });

      toast.success("🎉 Note uploaded to Walrus successfully!");

      onSubmit(title.trim(), content);

      setTitle("");
      setContent("");
      onClose();

      setIsUploading(false);
      setProgressText("Ready to upload");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Provide more user-friendly error messages
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes("WASM module failed to load")) {
        userFriendlyMessage = errorMessage; // Already user-friendly
      } else if (
        errorMessage.includes("400") ||
        errorMessage.includes("Bad Request")
      ) {
        userFriendlyMessage =
          "Storage nodes are having issues. This is usually temporary - please try again in a few minutes.";
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("timeout")
      ) {
        userFriendlyMessage =
          "Network connection issue. Please check your internet and try again.";
      } else if (errorMessage.includes("Wallet not connected")) {
        userFriendlyMessage = "Please connect your wallet and try again.";
      } else if (errorMessage.includes("rejected")) {
        userFriendlyMessage =
          "Transaction was rejected. Please try again and approve the transaction.";
      }

      toast.error(`Upload failed: ${userFriendlyMessage}`);
      setIsUploading(false);
      setProgressText("Ready to upload");
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Note</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter a title and content for your new note.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-note-title" className="text-white">
              Title *
            </Label>
            <Input
              id="new-note-title"
              placeholder="Enter note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-note-content" className="text-white">
              Content *
            </Label>
            <Textarea
              id="new-note-content"
              placeholder="Write your note here..."
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white resize-none"
            />
            <p className="text-sm text-gray-400">
              Characters: {content.length}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!isValid || isUploading || isTransactionPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isUploading || isTransactionPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>Create Note</>
              )}
            </Button>
          </div>

          {(isUploading || isTransactionPending) && (
            <p className="text-sm text-gray-400">{progressText}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
