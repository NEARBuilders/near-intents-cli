import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Token } from "@/services/tokens/schema";

const mocks = vi.hoisted(() => ({
	shouldUseInteractive: vi.fn(),
	resolveTokenWithOptionalPrompt: vi.fn(),
	promptBlockchainThenTokenSelection: vi.fn(),
	resolveAmountWithOptionalPrompt: vi.fn(),
	resolveToken: vi.fn(),
	getTokenBalances: vi.fn(),
	getSwapQuote: vi.fn(),
	executeSwapQuote: vi.fn(),
	hasApiKey: vi.fn(),
}));

vi.mock("@/utils/interactive", () => ({
	shouldUseInteractive: mocks.shouldUseInteractive,
	resolveTokenWithOptionalPrompt: mocks.resolveTokenWithOptionalPrompt,
	promptBlockchainThenTokenSelection: mocks.promptBlockchainThenTokenSelection,
	resolveAmountWithOptionalPrompt: mocks.resolveAmountWithOptionalPrompt,
}));

vi.mock("@/utils/token", () => ({
	resolveToken: mocks.resolveToken,
}));

vi.mock("@/services/swap", () => ({
	getSwapQuote: mocks.getSwapQuote,
	executeSwapQuote: mocks.executeSwapQuote,
}));

vi.mock("@/services/balance/balances", () => ({
	getTokenBalances: mocks.getTokenBalances,
}));

vi.mock("@/config", async () => {
	const actual = await vi.importActual<typeof import("@/config")>("@/config");
	return {
		...actual,
		hasApiKey: mocks.hasApiKey,
	};
});

function token(symbol: string, blockchain: string, id: string): Token {
	return {
		contractAddress: null,
		intentsTokenId: id,
		nearTokenId: id,
		defuseAssetIdentifier: id,
		standard: "ft",
		symbol,
		blockchain,
		decimals: 6,
		priceUSD: "1",
		minDepositAmount: "1",
		minDepositAmountFormatted: "0.000001",
		minWithdrawalAmount: "1",
		minWithdrawalAmountFormatted: "0.000001",
		withdrawalFee: "1",
		withdrawalFeeFormatted: "0.000001",
		balance: "0",
		balanceFormatted: "0",
	};
}

describe("swap command interactive", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.hasApiKey.mockReturnValue(true);
		mocks.getTokenBalances.mockResolvedValue([
			{ intentsTokenId: "usdc-eth" },
			{ intentsTokenId: "near" },
		]);
		mocks.getSwapQuote.mockResolvedValue({
			status: "success",
			amountInFormatted: "1",
			amountOutFormatted: "0.9",
			exchangeRate: "0.9",
			quote: {},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("keeps old error when non-interactive and required flag is missing", async () => {
		const { swapCommand } = await import("@/commands/swap");
		mocks.shouldUseInteractive.mockReturnValue(false);

		await expect(
			swapCommand({ walletAddress: "alice", privateKey: "ed25519:test" } as any, {
				to: "NEAR",
				amount: "1",
			}),
		).rejects.toThrow("--from is required");
	});

	it("prompts for missing fields in interactive mode", async () => {
		const { swapCommand } = await import("@/commands/swap");
		mocks.shouldUseInteractive.mockReturnValue(true);
		mocks.resolveTokenWithOptionalPrompt
			.mockResolvedValueOnce(token("USDC", "eth", "usdc-eth"));
		mocks.promptBlockchainThenTokenSelection.mockResolvedValue(
			token("NEAR", "near", "near"),
		);
		mocks.resolveAmountWithOptionalPrompt.mockResolvedValue("1");

		await swapCommand(
			{ walletAddress: "alice", privateKey: "ed25519:test" } as any,
			{ "dry-run": "true" },
		);

		expect(mocks.resolveTokenWithOptionalPrompt).toHaveBeenCalledTimes(1);
		expect(mocks.promptBlockchainThenTokenSelection).toHaveBeenCalledTimes(1);
		expect(mocks.resolveAmountWithOptionalPrompt).toHaveBeenCalledTimes(1);
	});

	it("keeps flag path unchanged when all required flags are present", async () => {
		const { swapCommand } = await import("@/commands/swap");
		mocks.shouldUseInteractive.mockReturnValue(false);
		mocks.resolveToken
			.mockResolvedValueOnce(token("USDC", "eth", "usdc-eth"))
			.mockResolvedValueOnce(token("NEAR", "near", "near"));

		await swapCommand(
			{ walletAddress: "alice", privateKey: "ed25519:test" } as any,
			{
				from: "USDC",
				to: "NEAR",
				amount: "1",
				"from-chain": "eth",
				"to-chain": "near",
				"dry-run": "true",
			},
		);

		expect(mocks.resolveToken).toHaveBeenCalledTimes(2);
		expect(mocks.resolveTokenWithOptionalPrompt).not.toHaveBeenCalled();
	});
});
