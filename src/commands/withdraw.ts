import { type Config, hasApiKey } from "../config";
import { getTokenBalances } from "../services/balance/balances";
import { executeWithdrawQuote, getWithdrawQuote } from "../services/withdraw";
import {
	resolveAddressWithOptionalPrompt,
	resolveAmountWithOptionalPrompt,
	resolveTokenWithOptionalPrompt,
	shouldUseInteractive,
} from "../utils/interactive";
import { resolveToken } from "../utils/token";

function showFeeNotice() {
	if (!hasApiKey()) {
		console.log(
			"\nNo API key configured. Withdrawals incur 0.1% fee.\n" +
				"Get free key: https://partners.near-intents.org/\n" +
				"Run: near-intents-cli config set api-key <your-key>\n",
		);
	}
}

export async function withdrawCommand(
	config: Config,
	flags: Record<string, string>,
) {
	const dryRun = flags["dry-run"] === "true";
	const interactive = shouldUseInteractive(flags, ["to", "amount", "token"]);
	const balanceTokenIds = await getBalanceTokenIds(config.walletAddress);

	const toAddress = await resolveAddressWithOptionalPrompt({
		address: flags.to,
		interactive,
		requiredErrorMessage: "--to is required",
		promptMessage: "Enter destination address",
	});
	const amount = await resolveAmountWithOptionalPrompt({
		amount: flags.amount,
		interactive,
		requiredErrorMessage: "--amount is required",
		promptMessage: "Enter amount to withdraw",
	});
	const token = interactive
		? await resolveTokenWithOptionalPrompt({
				symbol: flags.token,
				blockchain: flags.blockchain,
				flagName: "--blockchain",
				requiredErrorMessage: "--token is required",
				interactive,
				promptMessage: "Select token to withdraw",
				allowedTokenIds: balanceTokenIds,
			})
		: await resolveTokenOrThrow(flags);

	showFeeNotice();

	if (!balanceTokenIds.has(token.intentsTokenId)) {
		throw new Error(
			`Insufficient balance for ${token.symbol} (${token.blockchain})`,
		);
	}

	console.log(`Getting withdrawal quote...`);
	console.log(`Token: ${token.symbol} (${token.blockchain})`);
	console.log(`Amount: ${amount}`);
	console.log(`Destination: ${toAddress}`);

	const quoteResult = await getWithdrawQuote({
		walletAddress: config.walletAddress,
		destinationAddress: toAddress,
		assetId: token.intentsTokenId,
		amount,
		decimals: token.decimals,
	});

	if (quoteResult.status === "error") {
		throw new Error(quoteResult.message);
	}

	console.log(`\nQuote received:`);
	console.log(`  Amount: ${quoteResult.amountFormatted} ${token.symbol}`);
	console.log(`  Fee: ${quoteResult.transferFeeFormatted} ${token.symbol}`);
	console.log(
		`  You receive: ${quoteResult.receivedAmountFormatted} ${token.symbol}`,
	);

	if (dryRun) {
		console.log(`\n(Dry run - withdrawal not executed)`);
		return;
	}

	console.log(`\nExecuting withdrawal...`);

	const result = await executeWithdrawQuote({
		privateKey: config.privateKey,
		walletAddress: config.walletAddress,
		quote: quoteResult.quote,
	});

	console.log(`\nWithdrawal submitted!`);
	if (result.status === "success") {
		console.log(`Transaction: ${result.txHash}`);
		console.log(`Explorer: ${result.explorerLink}`);
	} else {
		console.log(`Error: ${result.message}`);
	}
}

async function resolveTokenOrThrow(flags: Record<string, string>) {
	const symbol = flags.token;
	const blockchain = flags.blockchain;

	if (!symbol) throw new Error("--token is required");

	return resolveToken(symbol, blockchain, "--blockchain");
}

async function getBalanceTokenIds(walletAddress: string): Promise<Set<string>> {
	const balances = await getTokenBalances({ walletAddress });
	if (balances.length === 0) {
		throw new Error("No token balances found. Deposit funds before withdrawing.");
	}
	return new Set(balances.map((token) => token.intentsTokenId));
}
