import { describe, expect, it, vi } from "vitest";

vi.mock("@defuse-protocol/one-click-sdk-typescript", async (importOriginal) => {
	const actual = await importOriginal<
		typeof import("@defuse-protocol/one-click-sdk-typescript")
	>();
	return {
		...actual,
		OneClickService: {
			...actual.OneClickService,
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

import { getSwapQuote } from "@/index";
import { getTokenBalances } from "@/services/balance/balances";
import { getSupportedTokens } from "@/services/tokens";
import { getSandboxCredentials } from "../setup";

describe("swap service", () => {
	function getWalletAddress(): string {
		return getSandboxCredentials().walletAddress;
	}

	describe("getSwapQuote", () => {
		it("should return error for insufficient balance", async () => {
			const walletAddress = getWalletAddress();
			const tokens = await getSupportedTokens();

			const fromToken = tokens.find(
				(t) => t.symbol === "USDC" && t.blockchain === "near",
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
				(b) => parseFloat(b.balanceFormatted) > 0.01,
			);
			if (!fromBalance) {
				console.log("No balance found for swap test, skipping");
				return;
			}

			// Find a different token to swap to
			const toToken = tokens.find(
				(t) => t.intentsTokenId !== fromBalance.intentsTokenId,
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
});
