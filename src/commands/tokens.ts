import { getSupportedTokens, searchTokens } from "../services/tokens";
import { formatTable } from "../utils/token";

export async function tokensCommand(flags: Record<string, string>) {
	const search = flags.search;

	const tokens = search
		? await searchTokens(search)
		: await getSupportedTokens();

	if (tokens.length === 0) {
		console.log("No tokens found");
		return;
	}

	const headers = ["Symbol", "Blockchain", "Token ID", "Decimals", "Price USD"];
	const rows = tokens.map((t) => [
		t.symbol,
		t.blockchain,
		t.intentsTokenId,
		String(t.decimals),
		t.priceUSD,
	]);

	console.log(formatTable(headers, rows));
	console.log(`\nTotal: ${tokens.length} tokens`);
}
