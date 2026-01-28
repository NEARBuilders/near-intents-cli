import { Config, hasApiKey } from "../config";
import { executeSwapQuote, getSwapQuote } from "../services/swap/service";
import { resolveToken } from "../utils/token";

function showFeeNotice() {
  if (!hasApiKey()) {
    console.log(
      "\nNo API key configured. Swaps incur 0.1% fee.\n" +
        "Get free key: https://partners.near-intents.org/\n" +
        "Run: near-intents config set api-key <your-key>\n"
    );
  }
}

export async function swapCommand(
  config: Config,
  flags: Record<string, string>
) {
  const fromSymbol = flags.from;
  const fromChain = flags["from-chain"];
  const toSymbol = flags.to;
  const toChain = flags["to-chain"];
  const amount = flags.amount;
  const dryRun = flags["dry-run"] === "true";

  if (!fromSymbol) throw new Error("--from is required");
  if (!toSymbol) throw new Error("--to is required");
  if (!amount) throw new Error("--amount is required");

  showFeeNotice();

  const fromToken = await resolveToken(fromSymbol, fromChain, "--from-chain");
  const toToken = await resolveToken(toSymbol, toChain, "--to-chain");

  console.log(`Getting quote...`);
  console.log(`From: ${amount} ${fromToken.symbol} (${fromToken.blockchain})`);
  console.log(`To: ${toToken.symbol} (${toToken.blockchain})`);

  const quoteResult = await getSwapQuote({
    walletAddress: config.walletAddress,
    fromTokenId: fromToken.intentsTokenId,
    toTokenId: toToken.intentsTokenId,
    amount,
  });

  if (quoteResult.status === "error") {
    throw new Error(quoteResult.message);
  }

  console.log(`\nQuote received:`);
  console.log(
    `  Amount in: ${quoteResult.amountInFormatted} ${fromToken.symbol}`
  );
  console.log(
    `  Amount out: ${quoteResult.amountOutFormatted} ${toToken.symbol}`
  );
  console.log(
    `  Rate: 1 ${fromToken.symbol} = ${quoteResult.exchangeRate} ${toToken.symbol}`
  );

  if (dryRun) {
    console.log(`\n(Dry run - swap not executed)`);
    return;
  }

  console.log(`\nExecuting swap...`);

  const result = await executeSwapQuote({
    privateKey: config.privateKey,
    walletAddress: config.walletAddress,
    quote: quoteResult.quote,
  });

  console.log(`\nSwap completed!`);
  console.log(`Transaction: ${result.txHash}`);
  console.log(`Explorer: ${result.explorerLink}`);
}
