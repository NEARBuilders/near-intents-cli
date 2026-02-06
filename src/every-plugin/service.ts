import { AuthMethod } from "@defuse-protocol/internal-utils";
import type { QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
import type { KeyPairString } from "@/types/near";
import { getTokenBalances } from "../services/balance/balances";
import type { TokenBalance } from "../services/balance/schema";
import { getDepositAddress } from "../services/deposit";
import {
	executeSwapQuote,
	getSwapQuote,
	type SwapExecuteResponse,
	type SwapQuoteResultInternal,
} from "../services/swap";
import {
	getSupportedTokens,
	searchTokens,
	type Token,
} from "../services/tokens";
import {
	executeTransfer,
	getTransferQuote,
	type TransferQuoteResult,
	type TransferSubmitResponse,
} from "../services/transfer";
import {
	executeWithdrawQuote,
	getWithdrawQuote,
	type WithdrawQuoteResultInternal,
	type WithdrawSubmitResponse,
} from "../services/withdraw";

export interface NearIntentsService {
	tokensList(search?: string): Promise<{ tokens: Token[] }>;
	tokensSearch(query: string, limit?: number): Promise<{ tokens: Token[] }>;
	balancesGet(
		walletAddress: string,
	): Promise<{ balances: TokenBalance[]; count: number }>;
	depositAddress(
		assetId: string,
	): Promise<{ address: string; chain: string; memo: string | null }>;
	swapQuote(params: {
		walletAddress: string;
		fromTokenId: string;
		toTokenId: string;
		amount: string;
	}): Promise<SwapQuoteResultInternal>;
	swapExecute(params: {
		walletAddress: string;
		quote: QuoteResponse;
	}): Promise<SwapExecuteResponse>;
	transferQuote(params: {
		walletAddress: string;
		tokenId: string;
		amount: string;
		decimals: number;
		toAddress: string;
	}): Promise<TransferQuoteResult>;
	transferExecute(params: {
		tokenId: string;
		amount: string;
		toAddress: string;
	}): Promise<TransferSubmitResponse>;
	withdrawQuote(params: {
		walletAddress: string;
		destinationAddress: string;
		assetId: string;
		amount: string;
		decimals: number;
	}): Promise<WithdrawQuoteResultInternal>;
	withdrawExecute(params: {
		walletAddress: string;
		quote: QuoteResponse;
	}): Promise<WithdrawSubmitResponse>;
}

export function createNearIntentsService(
	privateKey?: string,
): NearIntentsService & { privateKey?: string } {
	return {
		privateKey,

		async tokensList(search?: string) {
			if (search) {
				return { tokens: await searchTokens(search, { limit: 50 }) };
			}
			return { tokens: await getSupportedTokens() };
		},

		async tokensSearch(query: string, limit = 50) {
			const tokens = await searchTokens(query, { limit });
			return { tokens };
		},

		async balancesGet(walletAddress: string) {
			const balances = await getTokenBalances({ walletAddress });
			return { balances, count: balances.length };
		},

		async depositAddress(assetId: string) {
			const authIdentifier = assetId;
			return await getDepositAddress({
				authIdentifier,
				authMethod: AuthMethod.Near,
				assetId,
			});
		},

		async swapQuote(params) {
			return await getSwapQuote({
				walletAddress: params.walletAddress,
				fromTokenId: params.fromTokenId,
				toTokenId: params.toTokenId,
				amount: params.amount,
			});
		},

		async swapExecute(params) {
			if (!privateKey) {
				throw new Error("Private key not provided");
			}
			return await executeSwapQuote({
				privateKey: privateKey as KeyPairString,
				walletAddress: params.walletAddress,
				quote: params.quote,
			});
		},

		async transferQuote(params) {
			return await getTransferQuote({
				walletAddress: params.walletAddress,
				tokenId: params.tokenId,
				amount: params.amount,
				decimals: params.decimals,
				toAddress: params.toAddress,
			});
		},

		async transferExecute(params) {
			if (!privateKey) {
				throw new Error("Private key not provided");
			}
			return await executeTransfer({
				privateKey: privateKey as KeyPairString,
				tokenId: params.tokenId,
				amount: params.amount,
				toAddress: params.toAddress,
			});
		},

		async withdrawQuote(params) {
			return await getWithdrawQuote({
				walletAddress: params.walletAddress,
				destinationAddress: params.destinationAddress,
				assetId: params.assetId,
				amount: params.amount,
				decimals: params.decimals,
			});
		},

		async withdrawExecute(params) {
			if (!privateKey) {
				throw new Error("Private key not provided");
			}
			return await executeWithdrawQuote({
				privateKey: privateKey as KeyPairString,
				walletAddress: params.walletAddress,
				quote: params.quote,
			});
		},
	};
}
