import { useState, useEffect } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { useNetworkVariable } from "../networkConfig";
import { 
  Archive, 
  Download, 
  File, 
  FileText, 
  Folder, 
  Globe, 
  Lock, 
  RefreshCw, 
  Search, 
  User, 
  Database,
  AlertCircle,
  Terminal
} from "lucide-react";

interface VaultFileMetadata {
  original_filename: string;
  file_size: number;
  content_type: string;
  upload_timestamp: number;
}

interface VaultEntry {
  id: string;
  title: string;
  description: string;
  owner: string;
  walrus_blob_id: string;
  secondary_blob_id: string;
  file_metadata?: VaultFileMetadata;

  created_timestamp: number;
  is_encrypted: boolean;
  access_count: number;
}

export function VaultStore() {
  const vaultPackageId = useNetworkVariable("vaultPackageId");
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<"all" | "encrypted" | "public">("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  // Get unique owners from vault entries
  const uniqueOwners = [...new Set(vaultEntries.map((entry) => entry.owner))].sort();

  // Filter vault entries based on current filters
  const filteredEntries = vaultEntries.filter((entry) => {
    // Type filter
    const typeMatch =
      typeFilter === "all" ||
      (typeFilter === "encrypted" && entry.is_encrypted) ||
      (typeFilter === "public" && !entry.is_encrypted);

    // Owner filter
    const ownerMatch =
      ownerFilter === "all" ||
      entry.owner.toLowerCase() === ownerFilter.toLowerCase();

    return typeMatch && ownerMatch;
  });

  // Function to download file via CDN
  const downloadFile = async (
    patchId: string,
    fileName: string,
    entry?: VaultEntry,
  ) => {
    console.log(
      `Starting file download for patch ID: "${patchId}", file: "${fileName}"`,
    );

    try {
      // Early return for empty, mock, or invalid patch IDs
      if (!patchId || patchId === "" || patchId.startsWith("walrus_")) {
        console.log(`Cannot download: invalid patch ID "${patchId}"`);
        alert("No file available for this entry");
        return;
      }

      // Use aggregator CDN for direct download
      const AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";
      const CDNLink = `${AGGREGATOR_URL}/v1/blobs/by-quilt-patch-id/${patchId}`;

      console.log(`Using CDN link for download: ${CDNLink}`);

      // Determine filename for download
      let downloadFilename: string;
      if (entry?.file_metadata?.original_filename) {
        downloadFilename = entry.file_metadata.original_filename.replace(
          /[<>:"/\\|?*]/g,
          "_",
        );
        console.log(`Using original filename: ${downloadFilename}`);
      } else {
        // Fallback to entry title with appropriate extension
        downloadFilename = `${fileName.replace(/[^a-zA-Z0-9]/g, "_")}.bin`;
        console.log(`Generated filename: ${downloadFilename}`);
      }

      // Create download link that uses the CDN
      const link = document.createElement("a");
      link.href = CDNLink;
      link.download = downloadFilename;
      link.style.display = "none";

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(
        `Successfully initiated download for "${fileName}" via CDN`,
      );

      // Show confirmation message
      const fileSize = entry?.file_metadata?.file_size
        ? (entry.file_metadata.file_size / 1024 / 1024).toFixed(1) + " MB"
        : "Unknown size";

      alert(
        `Download started for "${fileName}"!\n\nFile: ${downloadFilename}\nSize: ${fileSize}\nUsing CDN: ${CDNLink}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to download file:`, {
        error: errorMessage,
        patchId,
        fileName,
      });

      alert(
        `Failed to download file: ${errorMessage}. Please try again or contact support if the problem persists.`,
      );
    }
  };

  // Query vault store object from the blockchain
  const vaultStoreObjectId = useNetworkVariable("vaultStoreObjectId");
  const { data: vaultStoreData, isLoading: isLoadingStore } = useSuiClientQuery(
    "getObject",
    {
      id: vaultStoreObjectId,
      options: {
        showContent: true,
      },
    },
    {
      enabled: !!vaultStoreObjectId,
    },
  );

  // Extract file and note IDs from vault store data
  const [allObjectIds, setAllObjectIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (vaultStoreData?.data?.content && 'fields' in vaultStoreData.data.content) {
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
  const { data: allVaultObjects, isLoading: isLoadingAll, error: queryError, refetch: refetchAll } = useSuiClientQuery(
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
    },
  );



  // No longer using events - we get IDs directly from vault store

  // Debug logging
  console.log("Vault Store Debug Info:");
  console.log("Package ID:", vaultPackageId);
  console.log("Vault Store Object ID:", vaultStoreObjectId);
  console.log("vaultStoreData query result:", vaultStoreData);
  console.log("allVaultObjects query result:", allVaultObjects);
  console.log("Combined object IDs:", allObjectIds);
  console.log("Query errors:", { queryError });
  console.log("Loading states:", {
    isLoadingStore,
    isLoadingAll,
  });

  useEffect(() => {
    // Process the vault objects when data is available
    const processVaultEntries = (objects: any[], source: string) => {
      console.log(`Processing vault entries from ${source}:`, objects);

      if (!objects) {
        console.log(`No objects provided from ${source}`);
        return [];
      }

      const processed = objects
        .map((obj, index) => {
          console.log(`Processing vault object ${index}:`, obj);

          const content = obj.data?.content;
          if (!content || !content.fields) {
            console.log(
              `Vault object ${index} missing content or fields:`,
              obj.data,
            );
            return null;
          }

          const fields = content.fields;
          console.log(`Fields for vault object ${index}:`, fields);

          // Helper function to extract metadata
          const extractMetadata = (
            metadataField: any,
          ): VaultFileMetadata | undefined => {
            if (!metadataField || !metadataField.fields) return undefined;

            const meta = metadataField.fields;
            return {
              original_filename: Array.isArray(meta.original_filename)
                ? new TextDecoder().decode(
                    new Uint8Array(meta.original_filename),
                  )
                : meta.original_filename || "",
              file_size: parseInt(meta.file_size) || 0,
              content_type: Array.isArray(meta.content_type)
                ? new TextDecoder().decode(new Uint8Array(meta.content_type))
                : meta.content_type || "",
              upload_timestamp: parseInt(meta.upload_timestamp) || 0,
            };
          };

          // Helper function to extract enhanced metadata
          const extractEnhancedMetadata = (enhancedMetadataString: string) => {
            try {
              const parsed = JSON.parse(enhancedMetadataString);
              return parsed.originalFile || {};
            } catch (error) {
              console.warn("Failed to parse enhanced metadata:", error);
              return {};
            }
          };

          // Determine if this is a file or note based on the type
          const isNote = obj.data.content.type.includes("::vault::UserNote");

          // Extract enhanced metadata if available
          const enhancedMeta = fields.enhanced_metadata 
            ? extractEnhancedMetadata(fields.enhanced_metadata)
            : {};

          const vaultEntry = {
            id: obj.data.objectId,
            title: enhancedMeta.name || 
                   (fields.metadata?.fields?.original_filename || "Untitled File"),
            description: isNote 
              ? "Note stored in vault" 
              : `File: ${enhancedMeta.name || "Unknown file"}`,
            owner: fields.owner || "Unknown",
            walrus_blob_id: fields.walrus_blob_id || "",
            secondary_blob_id: fields.secondary_blob_id || "",
            created_timestamp: parseInt(fields.metadata?.fields?.upload_timestamp) || 0,
            is_encrypted: enhancedMeta.isEncrypted || false,
            access_count: 0, // This field might not exist in the current structure
            // Extract metadata if available
            file_metadata: fields.metadata ? extractMetadata(fields.metadata) : undefined,
          };

          console.log(`Processed vault entry ${index} with metadata:`, {
            ...vaultEntry,
            hasFileMetadata: !!vaultEntry.file_metadata,
            walrusBlobId: vaultEntry.walrus_blob_id,
            secondaryBlobId: vaultEntry.secondary_blob_id,
          });
          return vaultEntry;
        })
        .filter(Boolean);

      console.log(`Final processed vault entries from ${source}:`, processed);
      return processed;
    };

    // Process the multiGetObjects result
    if (
      allVaultObjects &&
      Array.isArray(allVaultObjects) &&
      allVaultObjects.length > 0
    ) {
      console.log("Using allVaultObjects data from multiGetObjects");
      const processedEntries = processVaultEntries(allVaultObjects, "multiGetObjects");
      const validEntries = processedEntries.filter(Boolean) as VaultEntry[];

      setVaultEntries(validEntries);
      setLoading(false);
    } else if (!isLoadingAll && allObjectIds.length > 0) {
      console.log("multiGetObjects completed but no data returned");
      console.log("allVaultObjects:", allVaultObjects);
      setLoading(false);
    } else if (!isLoadingAll && allObjectIds.length === 0) {
      console.log("No object IDs found from vault store");
      setLoading(false);
    } else {
      console.log("Still loading or no data yet");
      console.log("Debug state:", {
        isLoadingAll,
        allObjectIdsLength: allObjectIds.length,
        allVaultObjects: allVaultObjects,
      });
    }
  }, [allVaultObjects, allObjectIds, isLoadingAll]);

  

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading || isLoadingStore || isLoadingAll) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Database className="h-8 w-8" />
            Vault Store
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-80">
              <CardContent className="p-4">
                <Skeleton className="h-40 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Database className="h-8 w-8" />
            Vault Store
          </h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Error loading vault entries:{" "}
              {(queryError as any)?.message || "Unknown error"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vaultEntries.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Database className="h-8 w-8" />
            Vault Store
          </h1>
        </div>
        <Card className="text-center p-12">
          <div className="w-24 h-24 mx-auto bg-muted rounded-lg flex items-center justify-center mb-4">
            <Database className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No Files Stored Yet</h2>
          <p className="text-muted-foreground mb-4">
            Upload your first file to the vault!
          </p>
          <p className="text-sm text-muted-foreground">
            Use the upload functionality to store files securely.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vault Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-3 flex items-center gap-3">
          <Database className="h-10 w-10" />
          Vault Files
        </h1>
        <p className="text-muted-foreground text-lg">
          Browse and download files stored in your decentralized vault.
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">Filters:</span>
            <Button
              variant={typeFilter === "encrypted" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("encrypted")}
            >
              <Lock className="h-4 w-4 mr-1" />
              Encrypted
            </Button>
            <Button
              variant={typeFilter === "public" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("public")}
            >
              <Globe className="h-4 w-4 mr-1" />
              Public
            </Button>
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("all")}
            >
              <Folder className="h-4 w-4 mr-1" />
              All Files
            </Button>

            {/* Owner Filter Dropdown */}
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="px-3 py-1 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Owners</option>
              {uniqueOwners.map((owner) => (
                <option key={owner} value={owner}>
                  {formatAddress(owner)}
                </option>
              ))}
            </select>
            
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("Manual refetch triggered");
                  refetchAll();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Badge variant="secondary">
                {filteredEntries.length} of {vaultEntries.length}{" "}
                {vaultEntries.length === 1 ? "File" : "Files"}
                {(typeFilter !== "all" || ownerFilter !== "all") &&
                  " (filtered)"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredEntries.length === 0 ? (
        <Card className="text-center p-12">
          <div className="w-24 h-24 mx-auto bg-muted rounded-lg flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No files found</h2>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters to see more files.
          </p>
          <Button
            onClick={() => {
              setTypeFilter("all");
              setOwnerFilter("all");
            }}
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            >
              <CardContent className="p-0">
                {/* File Icon Area */}
                <div
                  className={`h-40 rounded-t-lg flex flex-col items-center justify-center relative ${
                    entry.is_encrypted 
                      ? "bg-gradient-to-br from-blue-600 to-blue-800"
                      : "bg-gradient-to-br from-gray-600 to-gray-800"
                  }`}
                >
                  <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                    {entry.is_encrypted ? (
                      <Lock className="h-8 w-8 text-white" />
                    ) : (
                      <Folder className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <p className="text-white/80 text-sm italic mb-2">
                    {entry.is_encrypted ? "Encrypted" : "Public"}
                  </p>
                  {/* Download Button overlay */}
                  {entry.secondary_blob_id && !entry.secondary_blob_id.startsWith("walrus_") ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          // Use secondary_blob_id for data retrieval/fetching
                          downloadFile(entry.secondary_blob_id, entry.title, entry);
                        }}
                        className="bg-white/15 text-white border-white/30 hover:bg-white/25"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    ) : null}
                </div>

                <div className="p-4 space-y-3">
                  {/* Title and Type */}
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold truncate flex-1 mr-2">
                      {entry.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {entry.is_encrypted ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Globe className="h-3 w-3" />
                      )}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {entry.description}
                  </p>

                  {/* Owner */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {entry.owner.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {formatAddress(entry.owner)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {entry.access_count} downloads
                    </span>
                    <span className="font-medium">
                      {entry.file_metadata?.file_size 
                        ? formatFileSize(entry.file_metadata.file_size)
                        : "Unknown size"}
                    </span>
                  </div>

                  {/* File ID and Blob IDs for debugging */}
                  <div className="text-xs text-muted-foreground font-mono space-y-1">
                    <p className="truncate">ID: {entry.id.slice(0, 20)}...</p>
                    {entry.walrus_blob_id && (
                      <p className="truncate">Walrus: {entry.walrus_blob_id.slice(0, 20)}...</p>
                    )}
                    {entry.secondary_blob_id && (
                      <p className="truncate">Secondary: {entry.secondary_blob_id.slice(0, 20)}...</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Debug Info:
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground font-mono space-y-1">
            <div>Package ID: {vaultPackageId}</div>
            <div>Vault Store Object ID: {vaultStoreObjectId}</div>
            <div>Vault entries found: {vaultEntries.length}</div>
            <div>Loading: {loading ? "true" : "false"}</div>
            <div>Query results:</div>
            <div>• allObjectIds={allObjectIds.length}</div>
            <div>• allVaultObjects={Array.isArray(allVaultObjects) ? allVaultObjects.length : 0}</div>
            <div>• vaultStoreData={vaultStoreData?.data ? "found" : "not found"}</div>
            <div>Errors: {(queryError as any)?.message || "none"}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              console.log("Full vault debug dump:");
              console.table({
                packageId: vaultPackageId,
                vaultStoreObjectId,
                vaultEntriesLength: vaultEntries.length,
                loading,
                allObjectIdsLength: allObjectIds.length,
                allVaultObjectsLength: Array.isArray(allVaultObjects) ? allVaultObjects.length : 0,
                vaultStoreDataFound: !!vaultStoreData?.data,
                hasQueryError: !!queryError,
                isLoadingAll,
              });
              console.log("Detailed vault data:");
              console.log("allObjectIds:", allObjectIds);
              console.log("allVaultObjects:", allVaultObjects);
              console.log("vaultStoreData:", vaultStoreData);
            }}
          >
            <Terminal className="h-4 w-4 mr-1" />
            Console Dump
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}