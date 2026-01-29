import type { Config } from "../config";
import { getDepositAddress } from "../services/deposit";
import { resolveToken } from "../utils/token";

export async function depositCommand(
	config: Config,
	flags: Record<string, string>,
) {
	const symbol = flags.token;
	const blockchain = flags.blockchain;

	if (!symbol) {
		throw new Error("--token is required");
	}

	const token = await resolveToken(symbol, blockchain, "--blockchain");

	const result = await getDepositAddress({
		authIdentifier: config.walletAddress,
		authMethod: "near",
		assetId: token.defuseAssetIdentifier,
	});

	console.log(`Token: ${token.symbol} (${token.blockchain})`);
	console.log(`Deposit Address: ${result.address}`);
	console.log(
		`\nMin deposit: ${token.minDepositAmountFormatted} ${token.symbol}`,
	);
}
