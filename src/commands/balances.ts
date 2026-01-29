import type { Config } from "../config";
import { getTokenBalances } from "../services/balance/balances";
import { formatTable } from "../utils/token";

export async function balancesCommand(config: Config) {
	const balances = await getTokenBalances({
		walletAddress: config.walletAddress,
	});

	if (balances.length === 0) {
		console.log("No balances found");
		return;
	}

	const headers = ["Symbol", "Blockchain", "Balance"];
	const rows = balances.map((b) => [
		b.symbol,
		b.blockchain,
		b.balanceFormatted,
	]);

	console.log(`Wallet: ${config.walletAddress}\n`);
	console.log(formatTable(headers, rows));
}
