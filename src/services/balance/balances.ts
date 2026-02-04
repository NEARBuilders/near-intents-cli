import { AuthMethod, authIdentity } from "@defuse-protocol/internal-utils";
import { formatUnits } from "viem";
import { getSupportedTokens } from "../tokens";
import { batchBalanceOf } from "./batch";
import type { TokenBalance } from "./schema";

export async function getTokenBalances({
	walletAddress,
}: {
	walletAddress: string;
}): Promise<TokenBalance[]> {
	try {
		const accountId = authIdentity.authHandleToIntentsUserId(
			walletAddress,
			AuthMethod.Near,
		);
		const supportedTokens = await getSupportedTokens();

		const tokenIds = supportedTokens.map((token) => token.intentsTokenId);
		const amountsArray = await batchBalanceOf({
			accountId,
			tokenIds,
		});

		const amounts: Record<string, bigint> = {};

		for (let i = 0; i < tokenIds.length; i++) {
			amounts[tokenIds[i]] = BigInt(amountsArray[i]);
		}

		const result = supportedTokens
			.map((token) => ({
				...token,
				balance: String(amounts[token.intentsTokenId]),
				balanceFormatted: formatUnits(
					amounts[token.intentsTokenId],
					token.decimals,
				),
				logoURI: null,
			}))
			.filter((token) => token.balance !== "0");

		return result as TokenBalance[];
	} catch (error) {
		console.error(error);
		return [] as TokenBalance[];
	}
}
