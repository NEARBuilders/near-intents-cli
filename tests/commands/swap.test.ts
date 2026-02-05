import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@defuse-protocol/one-click-sdk-typescript", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("@defuse-protocol/one-click-sdk-typescript")
		>();
	return {
		...actual,
		OneClickService: {
			...actual.OneClickService,
			getTokens: vi.fn().mockResolvedValue([
				{
					assetId: "nep141:usdc.near",
					blockchain: "near",
					symbol: "USDC",
					decimals: 6,
					price: 1,
					priceUpdatedAt: new Date().toISOString(),
				},
				{
					assetId: "nep141:wrap.near",
					blockchain: "near",
					symbol: "NEAR",
					decimals: 24,
					price: 6.5,
					priceUpdatedAt: new Date().toISOString(),
				},
			]),
			getQuote: vi.fn().mockResolvedValue({
				correlationId: "mock-correlation-id",
				quote: {
					amountIn: "1000000",
					amountOut: "980000",
					deadline: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
					depositAddress: "mock-deposit-address",
				},
				quoteRequest: {
					amount: "1000000",
					originAsset: "nep141:usdc.near",
					destinationAsset: "nep141:wrap.near",
				},
			}),
		},
	};
});

import { swapCommand } from "@/commands/swap";
import { getTokenBalances } from "@/services/balance/balances";
import { getSupportedTokens } from "@/services/tokens";
import { getSandboxCredentials } from "../setup";

describe("swap command", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	function getConfig() {
		return getSandboxCredentials();
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
