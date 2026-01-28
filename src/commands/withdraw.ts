import { Config } from "../config";
import {
  executeWithdrawQuote,
  getWithdrawQuote,
} from "../services/withdraw/service";
import { resolveToken } from "../utils/token";

export async function withdrawCommand(
  config: Config,
  flags: Record<string, string>
) {
  const toAddress = flags.to;
  const amount = flags.amount;
  const symbol = flags.token;
  const blockchain = flags.blockchain;
  const dryRun = flags["dry-run"] === "true";

  if (!toAddress) throw new Error("--to is required");
  if (!amount) throw new Error("--amount is required");
  if (!symbol) throw new Error("--token is required");

  const token = await resolveToken(symbol, blockchain, "--blockchain");

  console.log(`Getting withdrawal quote...`);
  console.log(`Token: ${token.symbol} (${token.blockchain})`);
  console.log(`Amount: ${amount}`);
  console.log(`Destination: ${toAddress}`);

  const quoteResult = await getWithdrawQuote({
    walletAddress: config.walletAddress,
    destinationAddress: toAddress,
    assetId: token.intentsTokenId,
    amount,
    decimals: token.decimals,
  });

  if (quoteResult.status === "error") {
    throw new Error(quoteResult.message);
  }

  console.log(`\nQuote received:`);
  console.log(`  Amount: ${quoteResult.amountFormatted} ${token.symbol}`);
  console.log(`  Fee: ${quoteResult.transferFeeFormatted} ${token.symbol}`);
  console.log(
    `  You receive: ${quoteResult.receivedAmountFormatted} ${token.symbol}`
  );

  if (dryRun) {
    console.log(`\n(Dry run - withdrawal not executed)`);
    return;
  }

  console.log(`\nExecuting withdrawal...`);

  const result = await executeWithdrawQuote({
    privateKey: config.privateKey,
    walletAddress: config.walletAddress,
    quote: quoteResult.quote,
  });

  console.log(`\nWithdrawal submitted!`);
  console.log(`Transaction: ${result.txHash}`);
  console.log(`Explorer: ${result.explorerLink}`);
}
