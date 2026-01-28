import { poaBridge } from "@defuse-protocol/internal-utils";
import {
  OneClickService,
  TokenResponse,
} from "@defuse-protocol/one-click-sdk-typescript";
import Fuse from "fuse.js";
import { formatUnits } from "viem";
import { Token } from "./schema";

type PoaToken =
  poaBridge.httpClient.GetSupportedTokensResponse["result"]["tokens"][number];

interface PoaTokensResponse {
  tokens: PoaToken[];
}

const buildTokenFromData = (
  token: TokenResponse,
  poaToken: PoaToken
): Token => {
  return {
    contractAddress: token.contractAddress ?? null,
    intentsTokenId: poaToken.intents_token_id,
    nearTokenId: poaToken.near_token_id,
    defuseAssetIdentifier: poaToken.defuse_asset_identifier,
    standard: poaToken.standard,
    symbol:
      token.symbol === "wNEAR" && token.blockchain === "near"
        ? "NEAR"
        : token.symbol,
    blockchain: token.blockchain,
    decimals: poaToken.decimals,
    priceUSD: String(token.price),
    minDepositAmount: poaToken.min_deposit_amount,
    minDepositAmountFormatted: formatUnits(
      BigInt(poaToken.min_deposit_amount),
      poaToken.decimals
    ),
    minWithdrawalAmount: poaToken.min_withdrawal_amount,
    minWithdrawalAmountFormatted: formatUnits(
      BigInt(poaToken.min_withdrawal_amount),
      poaToken.decimals
    ),
    withdrawalFee: poaToken.withdrawal_fee,
    withdrawalFeeFormatted: formatUnits(
      BigInt(poaToken.withdrawal_fee),
      poaToken.decimals
    ),
    balance: "0",
    balanceFormatted: "0",
  };
};

export const getSupportedTokens = async (): Promise<Token[]> => {
  try {
    const [oneClickTokens, poaTokens] = await Promise.all([
      OneClickService.getTokens(),
      poaBridge.httpClient.getSupportedTokens({}) as Promise<PoaTokensResponse>,
    ]);

    const tokens = oneClickTokens.reduce((acc, token) => {
      const poaToken = poaTokens.tokens.find(
        (poaToken) => poaToken.intents_token_id === token.assetId
      );
      if (!poaToken) {
        return acc;
      }
      acc.push(buildTokenFromData(token, poaToken));
      return acc;
    }, [] as Token[]);

    return tokens;
  } catch (error) {
    console.error("Error fetching supported tokens:", error);
    return [];
  }
};

export const getToken = async (tokenId: string): Promise<Token | null> => {
  try {
    const tokens = await getSupportedTokens();
    const token = tokens.find(
      (t) =>
        t.intentsTokenId === tokenId ||
        t.nearTokenId === tokenId ||
        t.defuseAssetIdentifier === tokenId ||
        t.symbol.toLowerCase() === tokenId.toLowerCase()
    );
    return token || null;
  } catch (error) {
    console.error("Error fetching token:", error);
    return null;
  }
};

interface SearchTokensOptions {
  limit?: number;
  threshold?: number;
}

export const searchTokens = async (
  query: string,
  options?: SearchTokensOptions
): Promise<Token[]> => {
  try {
    const tokens = await getSupportedTokens();

    if (!query || query.trim() === "") {
      return tokens.slice(0, options?.limit || 50);
    }

    const fuse = new Fuse(tokens, {
      keys: [
        { name: "symbol", weight: 2 },
        { name: "nearTokenId", weight: 1.5 },
        { name: "blockchain", weight: 1 },
        { name: "defuseAssetIdentifier", weight: 1 },
      ],
      threshold: options?.threshold || 0.3,
      includeScore: true,
    });

    const results = fuse.search(query);
    const matchedTokens = results.map((result) => result.item);

    return matchedTokens.slice(0, options?.limit || 50);
  } catch (error) {
    console.error("Error searching tokens:", error);
    return [];
  }
};

interface SearchTokensBySymbolOptions {
  exact?: boolean;
  limit?: number;
}

export const searchTokensBySymbol = async (
  symbol: string,
  options?: SearchTokensBySymbolOptions
): Promise<Token[]> => {
  try {
    const tokens = await getSupportedTokens();
    const normalizedSymbol = symbol.toLowerCase().trim();

    let filtered: Token[];

    if (options?.exact) {
      filtered = tokens.filter(
        (t) => t.symbol.toLowerCase() === normalizedSymbol
      );
    } else {
      filtered = tokens.filter((t) =>
        t.symbol.toLowerCase().includes(normalizedSymbol)
      );
    }

    return filtered.slice(0, options?.limit || 50);
  } catch (error) {
    console.error("Error searching tokens by symbol:", error);
    return [];
  }
};

export const getTokensByBlockchain = async (
  blockchain: string
): Promise<Token[]> => {
  try {
    const tokens = await getSupportedTokens();
    return tokens.filter(
      (t) => t.blockchain.toLowerCase() === blockchain.toLowerCase()
    );
  } catch (error) {
    console.error("Error fetching tokens by blockchain:", error);
    return [];
  }
};

export const getTokenById = async (tokenId: string): Promise<Token | null> => {
  try {
    const tokens = await getSupportedTokens();
    return tokens.find((t) => t.intentsTokenId === tokenId) || null;
  } catch (error) {
    console.error("Error fetching token by id:", error);
    return null;
  }
};
