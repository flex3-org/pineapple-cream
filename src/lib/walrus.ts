import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { WalrusClient } from "@mysten/walrus";

export const suiClient = new SuiClient({
  url: getFullnodeUrl("testnet"),
});

// Initialize Walrus client with proper WASM handling
let walrusClient: WalrusClient | null = null;

export const getWalrusClient = async (): Promise<WalrusClient> => {
  if (walrusClient) {
    return walrusClient;
  }

  try {
    // Try to initialize with WASM URL from CDN
    walrusClient = new WalrusClient({
      network: "testnet",
      suiClient: suiClient as any,
      wasmUrl:
        "https://cdn.jsdelivr.net/npm/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm",
      uploadRelay: {
        timeout: 600_000,
        host: "https://upload-relay.testnet.walrus.space",
        sendTip: {
          max: 1_000,
        },
      },
    });
  } catch (error) {
    console.warn(
      "Failed to initialize Walrus with CDN WASM, trying without WASM URL:",
      error
    );

    // Fallback: try without explicit WASM URL
    walrusClient = new WalrusClient({
      network: "testnet",
      suiClient: suiClient as any,
      uploadRelay: {
        timeout: 600_000,
        host: "https://upload-relay.testnet.walrus.space",
        sendTip: {
          max: 1_000,
        },
      },
    });
  }

  return walrusClient;
};
