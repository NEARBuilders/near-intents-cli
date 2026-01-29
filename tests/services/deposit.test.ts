import { describe, it, expect } from "vitest";
import { KeyPair } from "near-api-js";
import { getDepositAddress } from "@/services/deposit";
import { getNearAddressFromKeyPair } from "@/services/near-intents/wallet";
import { getSupportedTokens } from "@/services/tokens/service";
import { hasPrivateKey, getTestPrivateKey } from "../setup";

describe.skipIf(!hasPrivateKey())("deposit service", () => {
  function getWalletAddress(): string {
    const privateKey = getTestPrivateKey()!;
    const keyPair = KeyPair.fromString(privateKey);
    return getNearAddressFromKeyPair(keyPair);
  }

  describe("getDepositAddress", () => {
    it("should return deposit address for ETH token", async () => {
      const walletAddress = getWalletAddress();
      const tokens = await getSupportedTokens();
      const ethToken = tokens.find(
        (t) => t.symbol === "USDC" && t.blockchain === "eth"
      );

      if (!ethToken) {
        console.log("USDC on eth not found, skipping");
        return;
      }

      const result = await getDepositAddress({
        authIdentifier: walletAddress,
        authMethod: "near",
        assetId: ethToken.defuseAssetIdentifier,
      });

      expect(result).toHaveProperty("address");
      expect(result.address).toBeTruthy();
      expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should return deposit address for Base token", async () => {
      const walletAddress = getWalletAddress();
      const tokens = await getSupportedTokens();
      const baseToken = tokens.find(
        (t) => t.symbol === "USDC" && t.blockchain === "base"
      );

      if (!baseToken) {
        console.log("USDC on base not found, skipping");
        return;
      }

      const result = await getDepositAddress({
        authIdentifier: walletAddress,
        authMethod: "near",
        assetId: baseToken.defuseAssetIdentifier,
      });

      expect(result).toHaveProperty("address");
      expect(result.address).toBeTruthy();
      expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should return deposit address for Solana token", async () => {
      const walletAddress = getWalletAddress();
      const tokens = await getSupportedTokens();
      const solToken = tokens.find(
        (t) => t.symbol === "USDC" && t.blockchain === "sol"
      );

      if (!solToken) {
        console.log("USDC on sol not found, skipping");
        return;
      }

      const result = await getDepositAddress({
        authIdentifier: walletAddress,
        authMethod: "near",
        assetId: solToken.defuseAssetIdentifier,
      });

      expect(result).toHaveProperty("address");
      expect(result.address).toBeTruthy();
    });
  });
});
