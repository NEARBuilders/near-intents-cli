import {
	createInternalTransferRoute,
	RouteEnum,
} from "@defuse-protocol/intents-sdk";
import { authIdentity } from "@defuse-protocol/internal-utils";
import { formatUnits, parseUnits } from "viem";
import type { KeyPairString } from "@/types/near";
import { batchBalanceOf } from "../balance/batch";
import { getNearIntentsSDK } from "../near-intents/sdk";
import { getSupportedTokens } from "../tokens/service";
import type { TransferQuoteResult, TransferSubmitResponse } from "./schema";

const AUTH_METHOD = "near";

export async function getTransferQuote({
	walletAddress,
	tokenId,
	amount,
	decimals,
	toAddress,
}: {
	walletAddress: string;
	tokenId: string;
	amount: string;
	decimals: number;
	toAddress: string;
}): Promise<TransferQuoteResult> {
	const accountId = authIdentity.authHandleToIntentsUserId(
		walletAddress,
		AUTH_METHOD,
	);

	const balances = await batchBalanceOf({
		accountId,
		tokenIds: [tokenId],
	});

	const balance = BigInt(balances[0] || "0");
	const amountInBaseUnits = parseUnits(amount, decimals);

	if (balance < amountInBaseUnits) {
		const supportedTokens = await getSupportedTokens();
		const token = supportedTokens.find((t) => t.intentsTokenId === tokenId);
		const balanceFormatted = formatUnits(balance, decimals);

		return {
			status: "error" as const,
			message: `Insufficient balance. Available: ${balanceFormatted} ${
				token?.symbol || tokenId
			}`,
		};
	}

	return {
		status: "success" as const,
		tokenId,
		amount: amountInBaseUnits.toString(),
		amountFormatted: amount,
		toAddress,
	};
}

export async function executeTransfer({
	privateKey,
	tokenId,
	amount,
	toAddress,
}: {
	privateKey: KeyPairString;
	tokenId: string;
	amount: string;
	toAddress: string;
}): Promise<TransferSubmitResponse> {
	const result = await transferToken({
		privateKey,
		tokenId,
		amount,
		toAddress,
	});

	return {
		status: "success" as const,
		txHash: result.txHash,
		explorerLink: `https://nearblocks.io/txns/${result.txHash}`,
	};
}

export const transferToken = async ({
	privateKey,
	tokenId,
	amount,
	toAddress,
}: {
	privateKey: KeyPairString;
	tokenId: string;
	amount: string;
	toAddress: string;
}) => {
	const sdk = await getNearIntentsSDK({ privateKey });
	const withdrawalIntents = await sdk.createWithdrawalIntents({
		withdrawalParams: {
			assetId: tokenId,
			amount: BigInt(amount),
			destinationAddress: toAddress,
			destinationMemo: undefined, // Destination memo is only used for XRP Ledger withdrawals
			feeInclusive: false,
			routeConfig: createInternalTransferRoute(),
		},
		feeEstimation: {
			amount: 0n,
			quote: null,
			underlyingFees: {
				[RouteEnum.InternalTransfer]: null,
			},
		},
	});

	const { intentHash } = await sdk.signAndSendIntent({
		intents: withdrawalIntents,
	});

	const { hash } = await sdk.waitForIntentSettlement({ intentHash });
	return {
		txHash: hash,
	};
};
