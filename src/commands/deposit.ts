import type { Config } from "../config";
import { getDepositAddress } from "../services/deposit";
import {
	promptBlockchainThenTokenSelection,
	resolveTokenWithOptionalPrompt,
	shouldUseInteractive,
} from "../utils/interactive";
import { resolveToken } from "../utils/token";

export async function depositCommand(
	config: Config,
	flags: Record<string, string>,
) {
	const interactive = shouldUseInteractive(flags, ["token"]);

	const token = interactive
		? !flags.token
			? await promptBlockchainThenTokenSelection({
					blockchainMessage: "Select blockchain for deposit",
					tokenMessage: "Select token for deposit",
				})
			: await resolveTokenWithOptionalPrompt({
					symbol: flags.token,
					blockchain: flags.blockchain,
					flagName: "--blockchain",
					requiredErrorMessage: "--token is required",
					interactive,
					promptMessage: "Select token for deposit",
				})
		: await resolveTokenOrThrow(flags);

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

async function resolveTokenOrThrow(flags: Record<string, string>) {
	const symbol = flags.token;
	const blockchain = flags.blockchain;

	if (!symbol) {
		throw new Error("--token is required");
	}

	return resolveToken(symbol, blockchain, "--blockchain");
}
