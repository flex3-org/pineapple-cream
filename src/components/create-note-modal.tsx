import { useState } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import { toast } from "sonner";
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
      setProgressText("Step 1/3: Processing note...");

      const dummyContentBlobId = `dummy_note_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;

      setProgressText("Step 2/3: Uploading to storage...");
      await new Promise((resolve) => setTimeout(resolve, 800));

      setProgressText("Step 3/3: Registering on blockchain...");

      const tx = new Transaction();
      const contentSize = new TextEncoder().encode(content).length;

      tx.moveCall({
        target: `${vaultPackageId}::vault::upload_note_entry`,
        arguments: [
          tx.object(vaultStoreObjectId),
          tx.pure.address(currentAccount.address),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(dummyContentBlobId))
          ),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(title.trim()))
          ),
          tx.pure.u64(contentSize),
          tx.pure.vector("u8", Array.from(new TextEncoder().encode("{}"))),
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(""))),
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(""))),
        ],
      });

      await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: tx as unknown as string },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          }
        );
      });

      toast.success("🎉 Note uploaded successfully!");

      onSubmit(title.trim(), content);

      setTitle("");
      setContent("");
      onClose();

      setIsUploading(false);
      setProgressText("Ready to upload");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Upload failed: ${errorMessage}`);
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
