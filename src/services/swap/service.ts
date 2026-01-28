import { KeyPairString } from "@/types/near";
import { QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { KeyPair } from "near-api-js";
import { formatUnits, parseUnits } from "viem";
import { getTokenBalances } from "../balance/balances";
import { getOneClickQuote, submitOneClickQuote } from "../oneclick/index";
import { getSupportedTokens } from "../tokens/service";
import { SwapExecuteResponse, SwapQuoteResultInternal } from "./schema";

function error(message: string): { status: "error"; message: string } {
  return { status: "error", message };
}

export async function getSwapQuote({
  walletAddress,
  fromTokenId,
  toTokenId,
  amount,
}: {
  walletAddress: string;
  fromTokenId: string;
  toTokenId: string;
  amount: string;
}): Promise<SwapQuoteResultInternal> {
  const supportedTokens = await getSupportedTokens();
  const fromToken = supportedTokens.find(
    (t) => t.intentsTokenId === fromTokenId
  );
  const toToken = supportedTokens.find((t) => t.intentsTokenId === toTokenId);

  if (!fromToken) {
    return error(`From token not found or not supported: ${fromTokenId}`);
  }

  if (!toToken) {
    return error(`To token not found or not supported: ${toTokenId}`);
  }

  const balances = await getTokenBalances({ walletAddress });
  const fromTokenBalance = balances.find(
    (b) => b.intentsTokenId === fromTokenId
  );

  if (!fromTokenBalance) {
    return error(`Insufficient balance for ${fromToken.symbol}`);
  }

  const amountInBaseUnits = parseUnits(amount, fromToken.decimals);
  const balanceInBaseUnits = BigInt(fromTokenBalance.balance);

  if (amountInBaseUnits > balanceInBaseUnits) {
    return error(
      `Insufficient balance. Available: ${fromTokenBalance.balanceFormatted} ${fromToken.symbol}`
    );
  }

  const quote = await getOneClickQuote({
    originAsset: fromTokenId,
    destinationAsset: toTokenId,
    toWalletAddress: walletAddress,
    fromWalletAddress: walletAddress,
    amount: amountInBaseUnits.toString(),
  });

  const amountInFormatted = formatUnits(
    BigInt(quote.quote.amountIn),
    fromToken.decimals
  );
  const amountOutFormatted = formatUnits(
    BigInt(quote.quote.amountOut),
    toToken.decimals
  );
  const exchangeRate = (
    parseFloat(amountOutFormatted) / parseFloat(amountInFormatted)
  ).toFixed(6);

  return {
    status: "success" as const,
    quote,
    fromTokenId,
    toTokenId,
    amountIn: quote.quote.amountIn,
    amountInFormatted,
    amountOut: quote.quote.amountOut,
    amountOutFormatted,
    exchangeRate,
  };
}

export async function executeSwapQuote({
  privateKey,
  walletAddress,
  quote,
}: {
  privateKey: KeyPairString;
  walletAddress: string;
  quote: QuoteResponse;
}): Promise<SwapExecuteResponse> {
  const wallet = KeyPair.fromString(privateKey);
  const { txHash } = await submitOneClickQuote({
    quote,
    wallet,
    walletAddress,
  });

  return {
    status: "success" as const,
    txHash,
    explorerLink: `https://nearblocks.io/txns/${txHash}`,
  };
}
