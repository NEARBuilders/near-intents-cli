import { type Config, hasApiKey } from "../config";
import { getTokenBalances } from "../services/balance/balances";
import { executeSwapQuote, getSwapQuote } from "../services/swap";
import {
	promptBlockchainThenTokenSelection,
	resolveAmountWithOptionalPrompt,
	resolveTokenWithOptionalPrompt,
	shouldUseInteractive,
} from "../utils/interactive";
import { resolveToken } from "../utils/token";

function showFeeNotice() {
	if (!hasApiKey()) {
		console.log(
			"\nNo API key configured. Swaps incur 0.1% fee.\n" +
				"Get free key: https://partners.near-intents.org/\n" +
				"Run: near-intents-cli config set api-key <your-key>\n",
		);
	}
}

export async function swapCommand(
	config: Config,
	flags: Record<string, string>,
) {
	const dryRun = flags["dry-run"] === "true";
	const interactive = shouldUseInteractive(flags, ["from", "to", "amount"]);
	const balanceTokenIds = await getBalanceTokenIds(config.walletAddress);

	const fromToken = interactive
		? await resolveTokenWithOptionalPrompt({
				symbol: flags.from,
				blockchain: flags["from-chain"],
				flagName: "--from-chain",
				requiredErrorMessage: "--from is required",
				interactive,
				promptMessage: "Select source token",
				allowedTokenIds: balanceTokenIds,
			})
		: await resolveFromTokenOrThrow(flags);

	const toToken = interactive
		? !flags.to
			? await promptBlockchainThenTokenSelection({
					blockchainMessage: "Select destination blockchain",
					tokenMessage: "Select destination token",
					excludeTokenId: fromToken.intentsTokenId,
				})
			: await resolveTokenWithOptionalPrompt({
					symbol: flags.to,
					blockchain: flags["to-chain"],
					flagName: "--to-chain",
					requiredErrorMessage: "--to is required",
					interactive,
					promptMessage: "Select destination token",
					excludeTokenId: fromToken.intentsTokenId,
				})
		: await resolveToTokenOrThrow(flags);

	const amount = await resolveAmountWithOptionalPrompt({
		amount: flags.amount,
		interactive,
		requiredErrorMessage: "--amount is required",
		promptMessage: "Enter amount to swap",
	});

	showFeeNotice();

	if (!balanceTokenIds.has(fromToken.intentsTokenId)) {
		throw new Error(
			`Insufficient balance for ${fromToken.symbol} (${fromToken.blockchain})`,
		);
	}

	console.log(`Getting quote...`);
	console.log(`From: ${amount} ${fromToken.symbol} (${fromToken.blockchain})`);
	console.log(`To: ${toToken.symbol} (${toToken.blockchain})`);

	const quoteResult = await getSwapQuote({
		walletAddress: config.walletAddress,
		fromTokenId: fromToken.intentsTokenId,
		toTokenId: toToken.intentsTokenId,
		amount,
	});

	if (quoteResult.status === "error") {
		throw new Error(quoteResult.message);
	}

	console.log(`\nQuote received:`);
	console.log(
		`  Amount in: ${quoteResult.amountInFormatted} ${fromToken.symbol}`,
	);
	console.log(
		`  Amount out: ${quoteResult.amountOutFormatted} ${toToken.symbol}`,
	);
	console.log(
		`  Rate: 1 ${fromToken.symbol} = ${quoteResult.exchangeRate} ${toToken.symbol}`,
	);

	if (dryRun) {
		console.log(`\n(Dry run - swap not executed)`);
		return;
	}

	console.log(`\nExecuting swap...`);

	const result = await executeSwapQuote({
		privateKey: config.privateKey,
		walletAddress: config.walletAddress,
		quote: quoteResult.quote,
	});

	console.log(`\nSwap submitted!`);
	if (result.status === "success") {
		console.log(`Transaction: ${result.txHash}`);
		console.log(`Explorer: ${result.explorerLink}`);
	} else {
		console.log(`Error: ${result.message}`);
	}
}

async function resolveFromTokenOrThrow(flags: Record<string, string>) {
	const fromSymbol = flags.from;
	const fromChain = flags["from-chain"];

	if (!fromSymbol) throw new Error("--from is required");

	return resolveToken(fromSymbol, fromChain, "--from-chain");
}

async function resolveToTokenOrThrow(flags: Record<string, string>) {
	const toSymbol = flags.to;
	const toChain = flags["to-chain"];

	if (!toSymbol) throw new Error("--to is required");

	return resolveToken(toSymbol, toChain, "--to-chain");
}

async function getBalanceTokenIds(walletAddress: string): Promise<Set<string>> {
	const balances = await getTokenBalances({ walletAddress });
	if (balances.length === 0) {
		throw new Error("No token balances found. Deposit funds before swapping.");
	}
	return new Set(balances.map((token) => token.intentsTokenId));
}
