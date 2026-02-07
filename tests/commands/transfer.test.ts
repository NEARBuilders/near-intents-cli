import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Token } from "@/services/tokens/schema";

const mocks = vi.hoisted(() => ({
	shouldUseInteractive: vi.fn(),
	resolveTokenWithOptionalPrompt: vi.fn(),
	resolveAmountWithOptionalPrompt: vi.fn(),
	resolveAddressWithOptionalPrompt: vi.fn(),
	resolveToken: vi.fn(),
	getTokenBalances: vi.fn(),
	getTransferQuote: vi.fn(),
	executeTransfer: vi.fn(),
}));

vi.mock("@/utils/interactive", () => ({
	shouldUseInteractive: mocks.shouldUseInteractive,
	resolveTokenWithOptionalPrompt: mocks.resolveTokenWithOptionalPrompt,
	resolveAmountWithOptionalPrompt: mocks.resolveAmountWithOptionalPrompt,
	resolveAddressWithOptionalPrompt: mocks.resolveAddressWithOptionalPrompt,
}));

vi.mock("@/utils/token", () => ({
	resolveToken: mocks.resolveToken,
}));

vi.mock("@/services/transfer", () => ({
	getTransferQuote: mocks.getTransferQuote,
	executeTransfer: mocks.executeTransfer,
}));

vi.mock("@/services/balance/balances", () => ({
	getTokenBalances: mocks.getTokenBalances,
}));

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

describe("transfer command", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getTokenBalances.mockResolvedValue([{ intentsTokenId: "usdc-eth" }]);
		mocks.resolveAddressWithOptionalPrompt.mockImplementation(
			async (options: { address?: string; requiredErrorMessage: string }) => {
				if (options.address?.trim()) {
					return options.address;
				}
				throw new Error(options.requiredErrorMessage);
			},
		);
		mocks.resolveAmountWithOptionalPrompt.mockImplementation(
			async (options: { amount?: string; requiredErrorMessage: string }) => {
				if (options.amount?.trim()) {
					return options.amount;
				}
				throw new Error(options.requiredErrorMessage);
			},
		);
		mocks.getTransferQuote.mockResolvedValue({
			status: "success",
			amount: "1000000",
			amountFormatted: "1",
		});
	});

	it("keeps old error when non-interactive and required flags are missing", async () => {
		const { transferCommand } = await import("@/commands/transfer");
		mocks.shouldUseInteractive.mockReturnValue(false);

		await expect(
			transferCommand(
				{ walletAddress: "alice", privateKey: "ed25519:test" } as any,
				{ token: "USDC", amount: "1" },
			),
		).rejects.toThrow("--to is required");
	});

	it("uses prompt helpers in interactive mode", async () => {
		const { transferCommand } = await import("@/commands/transfer");
		mocks.shouldUseInteractive.mockReturnValue(true);
		mocks.resolveAddressWithOptionalPrompt.mockResolvedValue("bob.near");
		mocks.resolveAmountWithOptionalPrompt.mockResolvedValue("1");
		mocks.resolveTokenWithOptionalPrompt.mockResolvedValue(
			token("USDC", "eth", "usdc-eth"),
		);

		await transferCommand(
			{ walletAddress: "alice", privateKey: "ed25519:test" } as any,
			{ "dry-run": "true" },
		);

		expect(mocks.resolveAddressWithOptionalPrompt).toHaveBeenCalledTimes(1);
		expect(mocks.resolveAmountWithOptionalPrompt).toHaveBeenCalledTimes(1);
		expect(mocks.resolveTokenWithOptionalPrompt).toHaveBeenCalledTimes(1);
	});

	it("keeps flag path unchanged with complete args", async () => {
		const { transferCommand } = await import("@/commands/transfer");
		mocks.shouldUseInteractive.mockReturnValue(false);
		mocks.resolveToken.mockResolvedValue(token("USDC", "eth", "usdc-eth"));

		await transferCommand(
			{ walletAddress: "alice", privateKey: "ed25519:test" } as any,
			{
				to: "bob.near",
				amount: "1",
				token: "USDC",
				blockchain: "eth",
				"dry-run": "true",
			},
		);

		expect(mocks.resolveToken).toHaveBeenCalledTimes(1);
		expect(mocks.resolveTokenWithOptionalPrompt).not.toHaveBeenCalled();
	});
});
