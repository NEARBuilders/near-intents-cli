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
					amountIn: "50000000",
					amountOut: "49500000",
					deadline: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
					depositAddress: "mock-deposit-address",
				},
				quoteRequest: {
					amount: "50000000",
					originAsset: "nep141:usdc.near",
					destinationAsset: "nep141:usdc.near",
				},
			}),
		},
	};
});

import { getWithdrawQuote } from "@/index";
import { getTokenBalances } from "@/services/balance/balances";
import { getSupportedTokens } from "@/services/tokens";
import { getSandboxCredentials } from "../setup";

describe("withdraw service", () => {
	function getWalletAddress(): string {
		return getSandboxCredentials().walletAddress;
	}

	describe("getWithdrawQuote", () => {
		it("should return error for insufficient balance", async () => {
			const walletAddress = getWalletAddress();
			const tokens = await getSupportedTokens();

			const token = tokens.find(
				(t) => t.symbol === "USDC" && t.blockchain === "eth",
			);
			if (!token) {
				console.log("USDC on eth not found, skipping");
				return;
			}

			const result = await getWithdrawQuote({
				walletAddress,
				destinationAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEe7",
				assetId: token.intentsTokenId,
				amount: "999999999",
				decimals: token.decimals,
			});

			expect(result.status).toBe("error");
			if (result.status === "error") {
				expect(result.message).toContain("Insufficient");
			}
		});

		it("should return quote when balance is sufficient", async () => {
			const walletAddress = getWalletAddress();
			const balances = await getTokenBalances({ walletAddress });
			const tokens = await getSupportedTokens();

			// Find an EVM token we have balance in (for withdrawal to ETH address)
			const evmChains = ["eth", "base", "arb", "polygon"];
			const fromBalance = balances.find(
				(b) =>
					evmChains.includes(b.blockchain) &&
					parseFloat(b.balanceFormatted) >
						parseFloat(b.minWithdrawalAmountFormatted) * 2,
			);

			if (!fromBalance) {
				console.log("No EVM balance found for withdrawal test, skipping");
				return;
			}

			const token = tokens.find(
				(t) => t.intentsTokenId === fromBalance.intentsTokenId,
			);
			if (!token) {
				console.log("Token not found, skipping");
				return;
			}

			const withdrawAmount = (
				parseFloat(fromBalance.minWithdrawalAmountFormatted) * 1.5
			).toFixed(token.decimals);

			const result = await getWithdrawQuote({
				walletAddress,
				destinationAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEe7",
				assetId: token.intentsTokenId,
				amount: withdrawAmount,
				decimals: token.decimals,
			});

			expect(result.status).toBe("success");
			if (result.status === "success") {
				expect(result.amount).toBeTruthy();
				expect(result.receivedAmount).toBeTruthy();
				expect(result.quote).toBeTruthy();
			}
		});
	});
});
