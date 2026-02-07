import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Token } from "@/services/tokens/schema";
import {
	isInteractiveTerminal,
	isValidNonEmptyAddress,
	isValidPositiveNumber,
	resolveTokenWithOptionalPrompt,
	shouldUseInteractive,
} from "@/utils/interactive";
import { searchTokensBySymbol } from "@/services/tokens/service";
import { resolveToken } from "@/utils/token";

vi.mock("@/services/tokens/service", () => ({
	getSupportedTokens: vi.fn(),
	searchTokensBySymbol: vi.fn(),
}));

vi.mock("@/utils/token", () => ({
	resolveToken: vi.fn(),
}));

const selectMock = vi.hoisted(() => vi.fn());
vi.mock("@inquirer/prompts", () => ({
	input: vi.fn(),
	search: vi.fn(),
	select: selectMock,
}));

function makeToken(symbol: string, blockchain: string, id: string): Token {
	return {
		contractAddress: null,
		intentsTokenId: id,
		nearTokenId: `${id}.near`,
		defuseAssetIdentifier: `asset:${id}`,
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

describe("interactive utils", () => {
	const originalInTTY = process.stdin.isTTY;
	const originalOutTTY = process.stdout.isTTY;

	beforeEach(() => {
		vi.clearAllMocks();
		Object.defineProperty(process.stdin, "isTTY", {
			value: originalInTTY,
			configurable: true,
		});
		Object.defineProperty(process.stdout, "isTTY", {
			value: originalOutTTY,
			configurable: true,
		});
	});

	afterEach(() => {
		Object.defineProperty(process.stdin, "isTTY", {
			value: originalInTTY,
			configurable: true,
		});
		Object.defineProperty(process.stdout, "isTTY", {
			value: originalOutTTY,
			configurable: true,
		});
	});

	it("detects interactive terminal only when stdin and stdout are TTY", () => {
		Object.defineProperty(process.stdin, "isTTY", {
			value: true,
			configurable: true,
		});
		Object.defineProperty(process.stdout, "isTTY", {
			value: true,
			configurable: true,
		});
		expect(isInteractiveTerminal()).toBe(true);

		Object.defineProperty(process.stdout, "isTTY", {
			value: false,
			configurable: true,
		});
		expect(isInteractiveTerminal()).toBe(false);
	});

	it("decides interactive mode from TTY + missing fields or --interactive", () => {
		Object.defineProperty(process.stdin, "isTTY", {
			value: true,
			configurable: true,
		});
		Object.defineProperty(process.stdout, "isTTY", {
			value: true,
			configurable: true,
		});

		expect(shouldUseInteractive({ from: "USDC" }, ["from", "to"]))
			.toBe(true);
		expect(
			shouldUseInteractive(
				{ from: "USDC", to: "NEAR", interactive: "true" },
				["from", "to"],
			),
		).toBe(true);
		expect(shouldUseInteractive({ from: "USDC", to: "NEAR" }, ["from", "to"]))
			.toBe(false);
	});

	it("stays non-interactive in non-TTY even with --interactive", () => {
		Object.defineProperty(process.stdin, "isTTY", {
			value: false,
			configurable: true,
		});
		Object.defineProperty(process.stdout, "isTTY", {
			value: false,
			configurable: true,
		});

		expect(shouldUseInteractive({ interactive: "true" }, ["token"])).toBe(
			false,
		);
	});

	it("validates amount and address helpers", () => {
		expect(isValidPositiveNumber("1")).toBe(true);
		expect(isValidPositiveNumber("0.01")).toBe(true);
		expect(isValidPositiveNumber("0")).toBe(false);
		expect(isValidPositiveNumber("abc")).toBe(false);

		expect(isValidNonEmptyAddress("0xabc")).toBe(true);
		expect(isValidNonEmptyAddress("   ")).toBe(false);
	});

	it("prompts for chain when symbol is ambiguous in interactive mode", async () => {
		const eth = makeToken("USDC", "eth", "usdc-eth");
		const base = makeToken("USDC", "base", "usdc-base");
		vi.mocked(resolveToken).mockRejectedValue(
			new Error("Multiple tokens found for USDC"),
		);
		vi.mocked(searchTokensBySymbol).mockResolvedValue([eth, base]);
		selectMock.mockResolvedValue("base");

		const token = await resolveTokenWithOptionalPrompt({
			symbol: "USDC",
			flagName: "--blockchain",
			requiredErrorMessage: "--token is required",
			interactive: true,
			promptMessage: "Select token",
		});

		expect(token.blockchain).toBe("base");
		expect(selectMock).toHaveBeenCalled();
	});

	it("keeps current error behavior outside interactive mode", async () => {
		vi.mocked(resolveToken).mockRejectedValue(new Error("Token not found: BAD"));

		await expect(
			resolveTokenWithOptionalPrompt({
				symbol: "BAD",
				flagName: "--blockchain",
				requiredErrorMessage: "--token is required",
				interactive: false,
				promptMessage: "Select token",
			}),
		).rejects.toThrow("Token not found: BAD");
	});
});
