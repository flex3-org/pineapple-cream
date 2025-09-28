import { useState } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
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
import { Progress } from "./ui/progress";
import { useNetworkVariable } from "../networkConfig";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";
import { getWalrusClient } from "../lib/walrus";
import { WalrusFile } from "@mysten/walrus";
import { extractTextFromFile, getContentTag } from "../lib/pdf-extractor";

interface FileMetadata {
  filename: string;
  file?: File;
}

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (fileId: string) => void;
}

export function UploadFileModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadFileModalProps) {
  const currentAccount = useCurrentAccount();
  const vaultPackageId = useNetworkVariable("vaultPackageId");
  const vaultStoreObjectId = useNetworkVariable("vaultStoreObjectId");

  const [metadata, setMetadata] = useState<FileMetadata>({
    filename: "",
  });

  const [contentTag, setContentTag] = useState<string>("");

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

  // Walrus upload function
  const uploadToWalrus = async (
    file: File,
    identifier: string,
    retryCount: number = 0
  ): Promise<{ blobId: string; patchId: string; actualSize: number }> => {
    if (!currentAccount) {
      throw new Error("Wallet not connected");
    }

    const maxRetries = 3;
    const isRetry = retryCount > 0;

    try {
      console.log(
        `${
          isRetry ? `[Retry ${retryCount}/${maxRetries}] ` : ""
        }Starting Walrus upload: ${identifier} (${file.size} bytes)`
      );

      // Create WalrusFile
      const walrusFile = WalrusFile.from({
        contents: file,
        identifier: file.name,
        tags: {
          contentType: file.type,
        },
      });

      console.log(`Created WalrusFile for ${file.name}`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Get Walrus client and start upload flow
      console.log(`Initializing Walrus client...`);
      const walrusClient = await getWalrusClient();

      console.log(`Starting Walrus upload flow...`);
      const uploadStart = Date.now();

      const flow = walrusClient.writeFilesFlow({
        files: [walrusFile],
      });

      console.log(`Encoding file for upload...`);
      await flow.encode();
      console.log(`Encoding completed`);

      console.log(`Creating register transaction...`);
      const registerTx = flow.register({
        epochs: 2, // Store for 2 epochs (~12 days)
        owner: currentAccount.address,
        deletable: false,
      });

      // Sign and execute the register transaction
      console.log(`Signing register transaction...`);
      const registerResult = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: registerTx },
          {
            onSuccess: (result) => {
              console.log(`Space registered successfully:`, result.digest);
              resolve(result);
            },
            onError: (error) => {
              console.error(`Space registration failed:`, error);
              reject(error);
            },
          }
        );
      });

      // Upload the data to storage nodes
      console.log(`Uploading file data to Walrus storage nodes...`);
      await flow.upload({
        digest: registerResult.digest,
      });

      // Create and execute the certify transaction
      console.log(`Creating certify transaction...`);
      const certifyTx = flow.certify();

      await new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: certifyTx },
          {
            onSuccess: (result) => {
              console.log(`Certify transaction successful:`, result.digest);
              resolve(result);
            },
            onError: (error) => {
              console.error(`Certify transaction failed:`, error);
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

      console.log(`Upload completed in ${Date.now() - uploadStart}ms`, {
        blobId,
        patchId,
        identifier,
        fileSize: file.size,
      });

      return { blobId, patchId, actualSize: file.size };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Walrus upload error for ${identifier}:`, {
        error: errorMessage,
        retryCount,
        identifier,
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
          `Retrying upload for ${identifier} (attempt ${retryCount + 1}/${
            maxRetries + 1
          })`
        );
        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return uploadToWalrus(file, identifier, retryCount + 1);
      }

      throw new Error(
        `Failed to upload ${identifier} after ${
          retryCount + 1
        } attempts: ${errorMessage}`
      );
    }
  };

  const getFileExtension = (file: File): string => {
    const fileName = file.name;
    const lastDotIndex = fileName.lastIndexOf(".");
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : "";
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMetadata((prev) => ({
        ...prev,
        file,
        filename: prev.filename || file.name,
      }));
    }
  };

  const handleMetadataChange =
    (field: keyof FileMetadata) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setMetadata((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleUploadFile = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!metadata.file) {
      toast.error("Please select a file");
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
        step: "Step 1/4: Analyzing file content...",
        progress: 25,
        isUploading: true,
      });

      // Extract text and get content tag
      let tag = "";
      try {
        const extractedText = await extractTextFromFile(metadata.file, 10);
        tag = await getContentTag(extractedText);
        setContentTag(tag);
        console.log(`Content tag generated: ${tag}`);
      } catch (error) {
        console.warn("Failed to generate content tag, using fallback:", error);
        tag = "untagged";
        setContentTag(tag);
      }

      setUploadProgress({
        step: "Step 2/4: Uploading file to Walrus...",
        progress: 50,
        isUploading: true,
      });

      // Upload file to Walrus
      const fileExtension = getFileExtension(metadata.file);
      const walrusResult = await uploadToWalrus(
        metadata.file,
        `${metadata.filename}${fileExtension}`
      );

      setUploadProgress({
        step: "Step 3/4: Registering on blockchain...",
        progress: 75,
        isUploading: true,
      });

      // Prepare enhanced metadata
      const enhancedMetadata = {
        originalFile: {
          name: metadata.file.name,
          size: metadata.file.size,
          type: metadata.file.type || "application/octet-stream",
          patchId: walrusResult.patchId,
          blobId: walrusResult.blobId,
          isEncrypted: false,
        },
      };

      // Create transaction to call vault contract
      const tx = new Transaction();

      tx.moveCall({
        target: `${vaultPackageId}::vault::upload_file_entry`,
        arguments: [
          tx.object(vaultStoreObjectId), // VaultStore shared object ID
          tx.pure.address(currentAccount.address),
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(tag))), // Content tag
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(walrusResult.blobId))
          ),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(metadata.filename))
          ),
          tx.pure.u64(metadata.file.size),
          tx.pure.vector(
            "u8",
            Array.from(
              new TextEncoder().encode(
                metadata.file.type || "application/octet-stream"
              )
            )
          ),
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

      console.log(`Signing file upload transaction...`);
      const uploadResult = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: tx as unknown as string },
          {
            onSuccess: (result) => {
              console.log(`File uploaded successfully:`, result.digest);
              resolve(result);
            },
            onError: (error) => {
              console.error(`File upload failed:`, error);
              reject(error);
            },
          }
        );
      });

      setUploadProgress({
        step: "Step 4/4: File uploaded successfully!",
        progress: 100,
        isUploading: false,
        success: true,
      });

      toast.success("File uploaded to Walrus successfully!");

      // Reset form
      setMetadata({
        filename: "",
      });
      setContentTag("");

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

      setUploadProgress({
        step: "Upload failed",
        progress: 0,
        isUploading: false,
        error: userFriendlyMessage,
      });
      toast.error(`Upload failed: ${userFriendlyMessage}`);
    }
  };

  const isFormValid = metadata.filename && metadata.file;

  const handleClose = () => {
    if (!uploadProgress.isUploading) {
      onClose();
      // Reset form
      setMetadata({
        filename: "",
      });
      setContentTag("");
      setUploadProgress({
        step: "Ready to upload",
        progress: 0,
        isUploading: false,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Upload className="h-5 w-5 text-blue-500" />
            Upload File to Vault
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload your file to decentralized storage with blockchain
            verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-white">
              Filename *
            </Label>
            <Input
              id="filename"
              placeholder="Enter filename"
              value={metadata.filename}
              onChange={handleMetadataChange("filename")}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file" className="text-white">
              Select File *
            </Label>
            <div className="relative">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file")?.click()}
                className="w-full justify-start bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              >
                <FileText className="mr-2 h-4 w-4" />
                {metadata.file ? metadata.file.name : "Choose file..."}
              </Button>
            </div>
            {metadata.file && (
              <div className="space-y-1">
                <p className="text-sm text-gray-400">
                  Selected: {metadata.file.name} (
                  {(metadata.file.size / 1024).toFixed(1)} KB)
                </p>
                {contentTag && (
                  <p className="text-sm text-blue-400">
                    Content Tag: {contentTag}
                  </p>
                )}
              </div>
            )}
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
                    Your file has been uploaded successfully!
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
              onClick={handleUploadFile}
              disabled={
                !isFormValid ||
                uploadProgress.isUploading ||
                isTransactionPending
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploadProgress.isUploading || isTransactionPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            * Your file will be uploaded to decentralized storage and registered
            on Sui blockchain. The file will be owned by your wallet address and
            only you can access it.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
