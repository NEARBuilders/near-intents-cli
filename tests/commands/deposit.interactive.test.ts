import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Token } from "@/services/tokens/schema";

const mocks = vi.hoisted(() => ({
	shouldUseInteractive: vi.fn(),
	resolveTokenWithOptionalPrompt: vi.fn(),
	promptBlockchainThenTokenSelection: vi.fn(),
	resolveToken: vi.fn(),
	getDepositAddress: vi.fn(),
}));

vi.mock("@/utils/interactive", () => ({
	shouldUseInteractive: mocks.shouldUseInteractive,
	resolveTokenWithOptionalPrompt: mocks.resolveTokenWithOptionalPrompt,
	promptBlockchainThenTokenSelection: mocks.promptBlockchainThenTokenSelection,
}));

vi.mock("@/utils/token", () => ({
	resolveToken: mocks.resolveToken,
}));

vi.mock("@/services/deposit", () => ({
	getDepositAddress: mocks.getDepositAddress,
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

describe("deposit command interactive", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getDepositAddress.mockResolvedValue({ address: "0x123" });
	});

	it("keeps old error when non-interactive and token is missing", async () => {
		const { depositCommand } = await import("@/commands/deposit");
		mocks.shouldUseInteractive.mockReturnValue(false);

		await expect(
			depositCommand(
				{ walletAddress: "alice", privateKey: "ed25519:test" } as any,
				{},
			),
		).rejects.toThrow("--token is required");
	});

	it("uses prompt path when interactive and token is missing", async () => {
		const { depositCommand } = await import("@/commands/deposit");
		mocks.shouldUseInteractive.mockReturnValue(true);
		mocks.promptBlockchainThenTokenSelection.mockResolvedValue(
			token("USDC", "eth", "usdc-eth"),
		);

		await depositCommand(
			{ walletAddress: "alice", privateKey: "ed25519:test" } as any,
			{},
		);

		expect(mocks.promptBlockchainThenTokenSelection).toHaveBeenCalledTimes(1);
		expect(mocks.resolveTokenWithOptionalPrompt).not.toHaveBeenCalled();
	});

	it("uses flag path when token is provided and non-interactive", async () => {
		const { depositCommand } = await import("@/commands/deposit");
		mocks.shouldUseInteractive.mockReturnValue(false);
		mocks.resolveToken.mockResolvedValue(token("USDC", "eth", "usdc-eth"));

		await depositCommand(
			{ walletAddress: "alice", privateKey: "ed25519:test" } as any,
			{ token: "USDC", blockchain: "eth" },
		);

		expect(mocks.resolveToken).toHaveBeenCalledTimes(1);
		expect(mocks.resolveTokenWithOptionalPrompt).not.toHaveBeenCalled();
	});
});
