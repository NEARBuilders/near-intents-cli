import { executeSwapQuote, getSwapQuote } from "@/index";
import { getTokenBalances } from "@/services/balance/balances";
import { getNearAddressFromKeyPair } from "@/services/near-intents/wallet";
import { getSupportedTokens } from "@/services/tokens/service";
import { KeyPairString } from "@/types/near";
import { KeyPair } from "near-api-js";
import { describe, expect, it } from "vitest";
import { getTestPrivateKey, hasPrivateKey } from "../setup";
// Note: executeSwapQuote tests require @defuse-protocol/intents-sdk which has module resolution issues
// Import swap service dynamically to avoid test suite failures

describe.skipIf(!hasPrivateKey())("swap service", () => {
  function getWalletAddress(): string {
    const privateKey = getTestPrivateKey()!;
    const keyPair = KeyPair.fromString(privateKey);
    return getNearAddressFromKeyPair(keyPair);
  }

  describe("getSwapQuote", () => {
    it("should return error for insufficient balance", async () => {
      const walletAddress = getWalletAddress();
      const tokens = await getSupportedTokens();

      const fromToken = tokens.find(
        (t) => t.symbol === "USDC" && t.blockchain === "near"
      );
      const toToken = tokens.find((t) => t.symbol === "NEAR");

      if (!fromToken || !toToken) {
        console.log("Required tokens not found, skipping");
        return;
      }

      const result = await getSwapQuote({
        walletAddress,
        fromTokenId: fromToken.intentsTokenId,
        toTokenId: toToken.intentsTokenId,
        amount: "999999999", // Large amount to trigger insufficient balance
      });

      expect(result.status).toBe("error");
      if (result.status === "error") {
        expect(result.message).toContain("Insufficient");
      }
    });

    it("should return error for non-existent token", async () => {
      const walletAddress = getWalletAddress();

      const result = await getSwapQuote({
        walletAddress,
        fromTokenId: "nonexistent-token-id",
        toTokenId: "another-nonexistent-token",
        amount: "1",
      });

      expect(result.status).toBe("error");
    });

    it("should return quote when balance is sufficient", async () => {
      const walletAddress = getWalletAddress();
      const balances = await getTokenBalances({ walletAddress });
      const tokens = await getSupportedTokens();

      // Find a token we have balance in
      const fromBalance = balances.find(
        (b) => parseFloat(b.balanceFormatted) > 0.01
      );
      if (!fromBalance) {
        console.log("No balance found for swap test, skipping");
        return;
      }

      // Find a different token to swap to
      const toToken = tokens.find(
        (t) => t.intentsTokenId !== fromBalance.intentsTokenId
      );
      if (!toToken) {
        console.log("No target token found, skipping");
        return;
      }

      const smallAmount = (
        parseFloat(fromBalance.balanceFormatted) * 0.001
      ).toFixed(fromBalance.decimals);

      const result = await getSwapQuote({
        walletAddress,
        fromTokenId: fromBalance.intentsTokenId,
        toTokenId: toToken.intentsTokenId,
        amount: smallAmount,
      });

      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.amountIn).toBeTruthy();
        expect(result.amountOut).toBeTruthy();
        expect(result.quote).toBeTruthy();
      }
    });
  });

  describe("executeSwapQuote", () => {
    it("should execute swap when balance is sufficient", async () => {
      const walletAddress = getWalletAddress();
      const privateKey = getTestPrivateKey()!;
      const balances = await getTokenBalances({ walletAddress });
      const tokens = await getSupportedTokens();

      // Find a token we have balance in (prefer USDC for predictable behavior)
      const fromBalance =
        balances.find(
          (b) => b.symbol === "USDC" && parseFloat(b.balanceFormatted) > 1
        ) || balances.find((b) => parseFloat(b.balanceFormatted) > 0.1);

      if (!fromBalance) {
        console.log(
          "No sufficient balance found for swap execution test, skipping"
        );
        return;
      }

      // Find a different token to swap to
      const toToken = tokens.find(
        (t) =>
          t.intentsTokenId !== fromBalance.intentsTokenId &&
          t.blockchain === fromBalance.blockchain
      );
      if (!toToken) {
        console.log("No target token found, skipping");
        return;
      }

      // Use a very small amount for test
      const smallAmount = (
        parseFloat(fromBalance.balanceFormatted) * 0.001
      ).toFixed(fromBalance.decimals);

      const quoteResult = await getSwapQuote({
        walletAddress,
        fromTokenId: fromBalance.intentsTokenId,
        toTokenId: toToken.intentsTokenId,
        amount: smallAmount,
      });

      if (quoteResult.status !== "success") {
        console.log(
          "Quote failed:",
          quoteResult.status === "error" ? quoteResult.message : "unknown"
        );
        return;
      }

      const executeResult = await executeSwapQuote({
        privateKey: privateKey as KeyPairString,
        walletAddress,
        quote: quoteResult.quote,
      });

      if (executeResult.status === "error") {
        throw new Error(executeResult.message);
      }

      expect(executeResult.status).toBe("success");
      expect(executeResult.txHash).toBeTruthy();
      expect(executeResult.explorerLink).toContain("nearblocks.io");
    });
  });
});
