import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const packageId = "0x13ff15b2c6e36948e92c2865451bc2d29f23ab4e8e28356d2836736372d7262c"
const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        packageId:
          packageId,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId:
          packageId,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        packageId:
          packageId,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
