import type { Config } from "../config";
import { executeTransfer, getTransferQuote } from "../services/transfer";
import { resolveToken } from "../utils/token";

export async function transferCommand(
	config: Config,
	flags: Record<string, string>,
) {
	const toAddress = flags.to;
	const amount = flags.amount;
	const symbol = flags.token;
	const blockchain = flags.blockchain;
	const dryRun = flags["dry-run"] === "true";

	if (!toAddress) throw new Error("--to is required");
	if (!amount) throw new Error("--amount is required");
	if (!symbol) throw new Error("--token is required");

	const token = await resolveToken(symbol, blockchain, "--blockchain");

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
