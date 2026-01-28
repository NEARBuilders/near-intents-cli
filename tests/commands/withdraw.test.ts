import { withdrawCommand } from "@/commands/withdraw";
import { getTokenBalances } from "@/services/balance/balances";
import { getNearAddressFromKeyPair } from "@/services/near-intents/wallet";
import { getSupportedTokens } from "@/services/tokens/service";
import { KeyPairString } from "@/types/near";
import { KeyPair } from "near-api-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTestPrivateKey, hasPrivateKey } from "../setup";

describe.skipIf(!hasPrivateKey())("withdraw command", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  function getConfig() {
    const privateKey = getTestPrivateKey()!;
    const keyPair = KeyPair.fromString(privateKey);
    const walletAddress = getNearAddressFromKeyPair(keyPair);
    return { privateKey: privateKey as KeyPairString, walletAddress };
  }

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should require --to flag", async () => {
    const config = getConfig();
    await expect(
      withdrawCommand(config, { token: "USDC", amount: "1", blockchain: "eth" })
    ).rejects.toThrow("--to is required");
  });

  it("should require --amount flag", async () => {
    const config = getConfig();
    await expect(
      withdrawCommand(config, {
        token: "USDC",
        to: "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEe7",
        blockchain: "eth",
      })
    ).rejects.toThrow("--amount is required");
  });

  it("should require --token flag", async () => {
    const config = getConfig();
    await expect(
      withdrawCommand(config, {
        to: "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEe7",
        amount: "1",
      })
    ).rejects.toThrow("--token is required");
  });

  it("should show quote with --dry-run", async () => {
    const config = getConfig();
    const balances = await getTokenBalances({
      walletAddress: config.walletAddress,
    });
    const tokens = await getSupportedTokens();

    // Find an EVM token we have enough balance in
    const evmChains = ["eth", "base", "arb", "polygon"];
    const fromBalance = balances.find(
      (b) =>
        evmChains.includes(b.blockchain) &&
        parseFloat(b.balanceFormatted) >
          parseFloat(b.minWithdrawalAmountFormatted) * 2
    );

    if (!fromBalance) {
      console.log(
        "No sufficient EVM balance found for withdrawal test, skipping"
      );
      return;
    }

    const token = tokens.find(
      (t) => t.intentsTokenId === fromBalance.intentsTokenId
    );
    if (!token) {
      console.log("Token not found, skipping");
      return;
    }

    const withdrawAmount = (
      parseFloat(fromBalance.minWithdrawalAmountFormatted) * 1.5
    ).toFixed(token.decimals);

    await withdrawCommand(config, {
      token: token.symbol,
      blockchain: token.blockchain,
      to: "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEe7",
      amount: withdrawAmount,
      "dry-run": "true",
    });

    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Quote received");
    expect(output).toContain("Dry run");
    expect(output).not.toContain("Withdrawal submitted");
  });

  it("should execute withdrawal without --dry-run", async () => {
    const config = getConfig();
    const balances = await getTokenBalances({
      walletAddress: config.walletAddress,
    });
    const tokens = await getSupportedTokens();

    // Find an EVM token we have enough balance in
    const evmChains = ["eth", "base", "arb", "polygon"];
    const fromBalance = balances.find(
      (b) =>
        evmChains.includes(b.blockchain) &&
        parseFloat(b.balanceFormatted) >
          parseFloat(b.minWithdrawalAmountFormatted) * 2
    );

    if (!fromBalance) {
      console.log(
        "No sufficient EVM balance found for withdrawal execution test, skipping"
      );
      return;
    }

    const token = tokens.find(
      (t) => t.intentsTokenId === fromBalance.intentsTokenId
    );
    if (!token) {
      console.log("Token not found, skipping");
      return;
    }

    const withdrawAmount = (
      parseFloat(fromBalance.minWithdrawalAmountFormatted) * 1.5
    ).toFixed(token.decimals);

    await withdrawCommand(config, {
      token: token.symbol,
      blockchain: token.blockchain,
      to: "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEe7",
      amount: withdrawAmount,
    });

    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Withdrawal submitted");
    expect(output).toContain("Transaction:");
  });
});
