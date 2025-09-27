import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_VAULT_PACKAGE_ID,
  TESTNET_VAULT_PACKAGE_ID,
  MAINNET_VAULT_PACKAGE_ID,
  DEVNET_VAULT_STORE_OBJECT_ID,
  TESTNET_VAULT_STORE_OBJECT_ID,
  MAINNET_VAULT_STORE_OBJECT_ID,
} from "./constants";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        vaultPackageId: DEVNET_VAULT_PACKAGE_ID,
        vaultStoreObjectId: DEVNET_VAULT_STORE_OBJECT_ID,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        vaultPackageId: TESTNET_VAULT_PACKAGE_ID,
        vaultStoreObjectId: TESTNET_VAULT_STORE_OBJECT_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        vaultPackageId: MAINNET_VAULT_PACKAGE_ID,
        vaultStoreObjectId: MAINNET_VAULT_STORE_OBJECT_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
