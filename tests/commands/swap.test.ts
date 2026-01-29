import { KeyPair } from "near-api-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { swapCommand } from "@/commands/swap";
import { getTokenBalances } from "@/services/balance/balances";
import { getNearAddressFromKeyPair } from "@/services/near-intents/wallet";
import { getSupportedTokens } from "@/services/tokens/service";
import type { KeyPairString } from "@/types/near";
import { getTestPrivateKey, hasPrivateKey } from "../setup";

describe.skipIf(!hasPrivateKey())("swap command", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	function getConfig() {
		const privateKey = getTestPrivateKey();
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

	it("should require --from flag", async () => {
		const config = getConfig();
		await expect(
			swapCommand(config, { to: "NEAR", amount: "1" }),
		).rejects.toThrow("--from is required");
	});

	it("should require --to flag", async () => {
		const config = getConfig();
		await expect(
			swapCommand(config, { from: "USDC", amount: "1" }),
		).rejects.toThrow("--to is required");
	});

	it("should require --amount flag", async () => {
		const config = getConfig();
		await expect(
			swapCommand(config, { from: "USDC", to: "NEAR" }),
		).rejects.toThrow("--amount is required");
	});

	it("should show quote with --dry-run", async () => {
		const config = getConfig();
		const balances = await getTokenBalances({
			walletAddress: config.walletAddress,
		});
		const tokens = await getSupportedTokens();

		// Find a token we have balance in
		const fromBalance = balances.find(
			(b) => parseFloat(b.balanceFormatted) > 0.01,
		);
		if (!fromBalance) {
			console.log("No balance found for swap test, skipping");
			return;
		}

		// Find a different token on same chain
		const toToken = tokens.find(
			(t) =>
				t.intentsTokenId !== fromBalance.intentsTokenId &&
				t.blockchain === fromBalance.blockchain,
		);
		if (!toToken) {
			console.log("No target token found, skipping");
			return;
		}

		const smallAmount = (
			parseFloat(fromBalance.balanceFormatted) * 0.001
		).toFixed(fromBalance.decimals);

		await swapCommand(config, {
			from: fromBalance.symbol,
			"from-chain": fromBalance.blockchain,
			to: toToken.symbol,
			"to-chain": toToken.blockchain,
			amount: smallAmount,
			"dry-run": "true",
		});

		const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
		expect(output).toContain("Quote received");
		expect(output).toContain("Dry run");
		expect(output).not.toContain("Swap completed");
	});
});
