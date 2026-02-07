import Fuse from "fuse.js";
import type { Token } from "../services/tokens/schema";
import {
	getSupportedTokens,
	searchTokensBySymbol,
} from "../services/tokens/service";
import { resolveToken } from "./token";

interface PromptModule {
	input: (options: {
		message: string;
		default?: string;
		validate?: (value: string) => true | string;
	}) => Promise<string>;
	select: <T>(options: {
		message: string;
		choices: Array<{ name: string; value: T }>;
	}) => Promise<T>;
	search: <T>(options: {
		message: string;
		source: (term?: string) => Promise<Array<{ name: string; value: T }>>;
	}) => Promise<T>;
}

interface ResolveTokenWithOptionalPromptOptions {
	symbol?: string;
	blockchain?: string;
	flagName: string;
	requiredErrorMessage: string;
	interactive: boolean;
	promptMessage: string;
	excludeTokenId?: string;
	allowedTokenIds?: Set<string>;
	allowedBlockchain?: string;
}

interface ResolveAmountOptions {
	amount?: string;
	interactive: boolean;
	requiredErrorMessage: string;
	promptMessage: string;
}

interface ResolveAddressOptions {
	address?: string;
	interactive: boolean;
	requiredErrorMessage: string;
	promptMessage: string;
}

interface PromptTokenSelectionOptions {
	message: string;
	excludeTokenId?: string;
	initialQuery?: string;
	allowedTokenIds?: Set<string>;
	allowedBlockchain?: string;
}

interface PromptBlockchainThenTokenSelectionOptions {
	blockchainMessage: string;
	tokenMessage: string;
	excludeTokenId?: string;
	allowedTokenIds?: Set<string>;
}

let promptModulePromise: Promise<PromptModule> | null = null;

async function getPrompts(): Promise<PromptModule> {
	if (!promptModulePromise) {
		promptModulePromise = import("@inquirer/prompts") as Promise<PromptModule>;
	}
	return promptModulePromise;
}

export function isInteractiveTerminal(): boolean {
	return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export function shouldUseInteractive(
	flags: Record<string, string>,
	requiredKeys: string[],
): boolean {
	if (!isInteractiveTerminal()) {
		return false;
	}

	if (flags.interactive === "true") {
		return true;
	}

	return requiredKeys.some((key) => !normalizeField(flags[key]));
}

export function isValidPositiveNumber(value: string): boolean {
	const trimmed = value.trim();
	if (!trimmed) return false;
	const parsed = Number(trimmed);
	return Number.isFinite(parsed) && parsed > 0;
}

export function isValidNonEmptyAddress(value: string): boolean {
	return value.trim().length > 0;
}

function normalizeField(value?: string): string | undefined {
	const trimmed = value?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function formatTokenLabel(token: Token): string {
	const suffix = token.intentsTokenId.slice(-8);
	return `${token.symbol} (${token.blockchain}) · ...${suffix}`;
}

export async function promptTokenSelection(
	options: PromptTokenSelectionOptions,
): Promise<Token> {
	const { search } = await getPrompts();
	const tokens = (await getSupportedTokens()).filter((token) => {
		if (token.intentsTokenId === options.excludeTokenId) return false;
		if (
			options.allowedTokenIds &&
			!options.allowedTokenIds.has(token.intentsTokenId)
		) {
			return false;
		}
		if (
			options.allowedBlockchain &&
			token.blockchain.toLowerCase() !== options.allowedBlockchain.toLowerCase()
		) {
			return false;
		}
		return true;
	});

	if (tokens.length === 0) {
		throw new Error("No eligible tokens found for selection");
	}

	const fuse = new Fuse(tokens, {
		keys: [
			{ name: "symbol", weight: 2 },
			{ name: "nearTokenId", weight: 1.5 },
			{ name: "blockchain", weight: 1 },
			{ name: "defuseAssetIdentifier", weight: 1 },
		],
		threshold: 0.3,
		includeScore: true,
	});

	const selected = await search<Token>({
		message: options.message,
		source: async (term?: string) => {
			const query = (term ?? options.initialQuery ?? "").trim();
			const matched = query
				? fuse.search(query).map((result) => result.item)
				: tokens;

			return matched.slice(0, 50).map((token) => ({
				name: formatTokenLabel(token),
				value: token,
			}));
		},
	});

	return selected;
}

export async function promptBlockchainThenTokenSelection(
	options: PromptBlockchainThenTokenSelectionOptions,
): Promise<Token> {
	const { select } = await getPrompts();
	const allTokens = await getSupportedTokens();
	const eligibleTokens = allTokens.filter((token) => {
		if (token.intentsTokenId === options.excludeTokenId) return false;
		if (
			options.allowedTokenIds &&
			!options.allowedTokenIds.has(token.intentsTokenId)
		) {
			return false;
		}
		return true;
	});

	if (eligibleTokens.length === 0) {
		throw new Error("No eligible tokens found for selection");
	}

	const blockchains = [...new Set(eligibleTokens.map((token) => token.blockchain))];
	const selectedBlockchain =
		blockchains.length === 1
			? blockchains[0]
			: await select<string>({
					message: options.blockchainMessage,
					choices: blockchains.map((blockchain) => ({
						name: blockchain,
						value: blockchain,
					})),
				});

	return promptTokenSelection({
		message: options.tokenMessage,
		excludeTokenId: options.excludeTokenId,
		allowedTokenIds: options.allowedTokenIds,
		allowedBlockchain: selectedBlockchain,
	});
}

export async function promptChainForSymbol(
	symbol: string,
	tokens: Token[],
): Promise<string> {
	const { select } = await getPrompts();

	if (tokens.length === 1) {
		return tokens[0].blockchain;
	}

	return select<string>({
		message: `Select blockchain for ${symbol}`,
		choices: tokens.map((token) => ({
			name: `${token.blockchain} (${token.symbol})`,
			value: token.blockchain,
		})),
	});
}

export async function resolveTokenWithOptionalPrompt(
	options: ResolveTokenWithOptionalPromptOptions,
): Promise<Token> {
	const symbol = normalizeField(options.symbol);
	const blockchain = normalizeField(options.blockchain);
	const isAllowed = (token: Token): boolean =>
		!options.allowedTokenIds ||
		options.allowedTokenIds.has(token.intentsTokenId);

	if (!symbol) {
		if (!options.interactive) {
			throw new Error(options.requiredErrorMessage);
		}

		return promptTokenSelection({
			message: options.promptMessage,
			excludeTokenId: options.excludeTokenId,
			allowedTokenIds: options.allowedTokenIds,
			allowedBlockchain: options.allowedBlockchain,
		});
	}

	try {
		const token = await resolveToken(symbol, blockchain, options.flagName);
		if (isAllowed(token)) {
			return token;
		}

		const error = new Error(
			`Token ${token.symbol} (${token.blockchain}) is not available for this action`,
		);
		if (!options.interactive) {
			throw error;
		}

		return promptTokenSelection({
			message: `${error.message}\n${options.promptMessage}`,
			excludeTokenId: options.excludeTokenId,
			initialQuery: symbol,
			allowedTokenIds: options.allowedTokenIds,
			allowedBlockchain: options.allowedBlockchain,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (!options.interactive) {
			throw error;
		}

		const exactMatches = (await searchTokensBySymbol(symbol, {
			exact: true,
		})).filter(
			(token) =>
				token.intentsTokenId !== options.excludeTokenId && isAllowed(token),
		);

		if (exactMatches.length === 0) {
			return promptTokenSelection({
				message: `${message}\n${options.promptMessage}`,
				excludeTokenId: options.excludeTokenId,
				initialQuery: symbol,
				allowedTokenIds: options.allowedTokenIds,
				allowedBlockchain: options.allowedBlockchain,
			});
		}

		if (!blockchain && exactMatches.length > 1) {
			const selectedChain = await promptChainForSymbol(symbol, exactMatches);
			const selected = exactMatches.find(
				(token) =>
					token.blockchain.toLowerCase() === selectedChain.toLowerCase(),
			);
			if (selected) {
				return selected;
			}
		}

		if (blockchain && exactMatches.length >= 1) {
			const selectedChain = await promptChainForSymbol(symbol, exactMatches);
			const selected = exactMatches.find(
				(token) =>
					token.blockchain.toLowerCase() === selectedChain.toLowerCase(),
			);
			if (selected) {
				return selected;
			}
		}

		throw error;
	}
}

export async function promptAmount(message: string): Promise<string> {
	const { input } = await getPrompts();
	return input({
		message,
		validate: (value) =>
			isValidPositiveNumber(value)
				? true
				: "Enter a positive numeric amount",
	});
}

export async function promptAddress(message: string): Promise<string> {
	const { input } = await getPrompts();
	return input({
		message,
		validate: (value) =>
			isValidNonEmptyAddress(value)
				? true
				: "Address cannot be empty",
	});
}

export async function resolveAmountWithOptionalPrompt(
	options: ResolveAmountOptions,
): Promise<string> {
	const rawAmount = options.amount;
	const amount = normalizeField(rawAmount);

	if (amount && isValidPositiveNumber(amount)) {
		return amount;
	}

	if (!options.interactive) {
		if (rawAmount === undefined || rawAmount === "") {
			throw new Error(options.requiredErrorMessage);
		}
		return rawAmount;
	}

	return promptAmount(options.promptMessage);
}

export async function resolveAddressWithOptionalPrompt(
	options: ResolveAddressOptions,
): Promise<string> {
	const rawAddress = options.address;
	const address = normalizeField(rawAddress);

	if (address && isValidNonEmptyAddress(address)) {
		return address;
	}

	if (!options.interactive) {
		if (rawAddress === undefined || rawAddress === "") {
			throw new Error(options.requiredErrorMessage);
		}
		return rawAddress;
	}

	return promptAddress(options.promptMessage);
}
