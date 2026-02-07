import type { Config } from "../config";
import { getTokenBalances } from "../services/balance/balances";
import { executeTransfer, getTransferQuote } from "../services/transfer";
import {
	resolveAddressWithOptionalPrompt,
	resolveAmountWithOptionalPrompt,
	resolveTokenWithOptionalPrompt,
	shouldUseInteractive,
} from "../utils/interactive";
import { resolveToken } from "../utils/token";

export async function transferCommand(
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
		promptMessage: "Enter destination near-intents address",
	});
	const amount = await resolveAmountWithOptionalPrompt({
		amount: flags.amount,
		interactive,
		requiredErrorMessage: "--amount is required",
		promptMessage: "Enter amount to transfer",
	});
	const token = interactive
		? await resolveTokenWithOptionalPrompt({
				symbol: flags.token,
				blockchain: flags.blockchain,
				flagName: "--blockchain",
				requiredErrorMessage: "--token is required",
				interactive,
				promptMessage: "Select token to transfer",
				allowedTokenIds: balanceTokenIds,
			})
		: await resolveTokenOrThrow(flags);

	if (!balanceTokenIds.has(token.intentsTokenId)) {
		throw new Error(
			`Insufficient balance for ${token.symbol} (${token.blockchain})`,
		);
	}

	console.log(`Getting transfer quote...`);
	console.log(`Token: ${token.symbol} (${token.blockchain})`);
	console.log(`Amount: ${amount}`);
	console.log(`Destination: ${toAddress}`);

	const quoteResult = await getTransferQuote({
		walletAddress: config.walletAddress,
		tokenId: token.intentsTokenId,
		amount,
		decimals: token.decimals,
		toAddress,
	});

	if (quoteResult.status === "error") {
		throw new Error(quoteResult.message);
	}

	console.log(`\nTransfer details:`);
	console.log(`  Amount: ${quoteResult.amountFormatted} ${token.symbol}`);
	console.log(`  Fee: 0 (internal transfer)`);
	console.log(
		`  Recipient receives: ${quoteResult.amountFormatted} ${token.symbol}`,
	);

	if (dryRun) {
		console.log(`\n(Dry run - transfer not executed)`);
		return;
	}

	console.log(`\nExecuting transfer...`);

	const result = await executeTransfer({
		privateKey: config.privateKey,
		tokenId: token.intentsTokenId,
		amount: quoteResult.amount,
		toAddress,
	});

	console.log(`\nTransfer submitted!`);
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
		throw new Error("No token balances found. Deposit funds before transferring.");
	}
	return new Set(balances.map((token) => token.intentsTokenId));
}
