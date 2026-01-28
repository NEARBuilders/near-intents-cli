import { authIdentity } from "@defuse-protocol/internal-utils";
import { formatUnits } from "viem";
import { getSupportedTokens } from "../tokens/service";
import { batchBalanceOf } from "./batch";
import { TokenBalance } from "./schema";

const AUTH_METHOD = "near";

export async function getTokenBalances({
  walletAddress,
}: {
  walletAddress: string;
}): Promise<TokenBalance[]> {
  try {
    const accountId = authIdentity.authHandleToIntentsUserId(
      walletAddress,
      AUTH_METHOD
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
          token.decimals
        ),
      }))
      .filter((token) => token.balance !== "0");

    return result as TokenBalance[];
  } catch (error) {
    return [] as TokenBalance[];
  }
}
