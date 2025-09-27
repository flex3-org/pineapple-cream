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
        step: "Step 1/3: Processing file...",
        progress: 33,
        isUploading: true,
      });

      // Generate dummy Walrus blob ID for testing
      const dummyWalrusBlobId = `dummy_blob_${Date.now()}_${Math.random()
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

      tx.moveCall({
        target: `${vaultPackageId}::vault::upload_file_entry`,
        arguments: [
          tx.object(vaultStoreObjectId), // VaultStore shared object ID
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(dummyWalrusBlobId))
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
          tx.pure.vector("u8", Array.from(new TextEncoder().encode("{}"))), // enhanced_metadata
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(""))), // secondary_blob_id
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(""))), // seal_encryption_id
        ],
      });

      console.log(`📄 Signing file upload transaction...`);
      const uploadResult = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: tx as unknown as string },
          {
            onSuccess: (result) => {
              console.log(`✅ File uploaded successfully:`, result.digest);
              resolve(result);
            },
            onError: (error) => {
              console.error(`❌ File upload failed:`, error);
              reject(error);
            },
          }
        );
      });

      setUploadProgress({
        step: "File uploaded successfully!",
        progress: 100,
        isUploading: false,
        success: true,
      });

      toast.success("🎉 File uploaded successfully!");

      // Reset form
      setMetadata({
        filename: "",
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

  const isFormValid = metadata.filename && metadata.file;

  const handleClose = () => {
    if (!uploadProgress.isUploading) {
      onClose();
      // Reset form
      setMetadata({
        filename: "",
      });
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
              <p className="text-sm text-gray-400">
                Selected: {metadata.file.name} (
                {(metadata.file.size / 1024).toFixed(1)} KB)
              </p>
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
                    🎉 Your file has been uploaded successfully!
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
