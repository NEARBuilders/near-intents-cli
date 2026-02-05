import "dotenv/config";
import { createPluginRuntime } from "every-plugin";
import { version } from "../package.json";
import { hasApiKey, loadConfig } from "./config";
import NearIntentsPlugin from "./every-plugin";
import { parseArgs } from "./utils/args";
import { formatTable, resolveToken } from "./utils/token";

// ANSI color codes for terminal styling
const COLORS = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	cyan: "\x1b[36m",
	magenta: "\x1b[35m",
	blue: "\x1b[34m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	white: "\x1b[37m",
};

const HELP = `
${COLORS.bright}${COLORS.cyan}Near Intents CLI${COLORS.reset} v${version}
Cross-chain token swaps via intent-based execution.

${COLORS.yellow}API KEY:${COLORS.reset}
  Get free key: ${COLORS.green}https://partners.near-intents.org/${COLORS.reset}
  Without key: 0.1% swap fee
  Set: near-intents-cli config set api-key <key>

${COLORS.bright}${COLORS.cyan}COMMANDS:${COLORS.reset}
  ${COLORS.green}tokens${COLORS.reset}      List/search supported tokens
  ${COLORS.green}balances${COLORS.reset}   Show wallet balances
  ${COLORS.green}deposit${COLORS.reset}    Get deposit address
  ${COLORS.green}swap${COLORS.reset}       Execute token swap
  ${COLORS.green}transfer${COLORS.reset}   Transfer to another near-intents account
  ${COLORS.green}withdraw${COLORS.reset}   Withdraw to external address
  ${COLORS.green}config${COLORS.reset}     Manage settings (api-key, private-key)

${COLORS.bright}${COLORS.cyan}OPTIONS:${COLORS.reset}
  ${COLORS.green}--help, -h${COLORS.reset}          Show help
  ${COLORS.green}--version, -v${COLORS.reset}       Show version

${COLORS.bright}${COLORS.cyan}COMMAND OPTIONS:${COLORS.reset}
  ${COLORS.green}tokens:${COLORS.reset}
    --search <query>            Filter tokens by search query

  ${COLORS.green}deposit:${COLORS.reset}
    --token <symbol>            Token symbol (required)
    --blockchain <chain>        Blockchain (required if token exists on multiple chains)

  ${COLORS.green}swap:${COLORS.reset}
    --from <symbol>             Source token symbol (required)
    --from-chain <chain>        Source blockchain
    --to <symbol>               Destination token symbol (required)
    --to-chain <chain>          Destination blockchain
    --amount <num>              Amount to swap (required)
    --dry-run                   Show quote without executing

  ${COLORS.green}transfer:${COLORS.reset}
    --to <address>              Destination near-intents address (required)
    --amount <num>              Amount to transfer (required)
    --token <symbol>            Token symbol (required)
    --blockchain <chain>        Blockchain (if token on multiple chains)
    --dry-run                   Show quote without executing

  ${COLORS.green}withdraw:${COLORS.reset}
    --to <address>              Destination address (required)
    --amount <num>              Amount to withdraw (required)
    --token <symbol>            Token symbol (required)
    --blockchain <chain>        Blockchain (required if token exists on multiple chains)
    --dry-run                   Show quote without executing

  ${COLORS.green}config:${COLORS.reset}
    set api-key <key>           Save API key
    set private-key <key>       Save private key
    generate-key                Generate new NEAR key pair
    get                         Show current config
    clear                       Remove config file

${COLORS.bright}${COLORS.cyan}EXAMPLES:${COLORS.reset}
  near-intents-cli config generate-key
  near-intents-cli config set api-key YOUR_KEY
  near-intents-cli tokens --search USDC
  near-intents-cli balances
  near-intents-cli deposit --token USDC --blockchain eth
  near-intents-cli swap --from USDC --to NEAR --amount 100
  near-intents-cli swap --from USDC --to NEAR --amount 100 --dry-run
  near-intents-cli transfer --to 0x... --amount 50 --token USDC
  near-intents-cli withdraw --to 0x123... --amount 50 --token USDC --blockchain eth

${COLORS.bright}${COLORS.cyan}EXIT CODES:${COLORS.reset}
  0  Success
  1  Error (invalid args, API error, etc.)
`;

function showFeeNotice() {
	if (!hasApiKey()) {
		console.log(
			"\nNo API key configured. Swaps incur 0.1% fee.\n" +
				"Get free key: https://partners.near-intents.org/\n" +
				"Run: near-intents-cli config set api-key <your-key>\n",
		);
	}
}

async function main() {
	const args = process.argv.slice(2);
	const { command, flags, positional } = parseArgs(args);

	// Handle --version / -v
	if (flags.version === "true" || flags.v === "true") {
		console.log(`near-intents-cli v${version}`);
		return;
	}

	// Handle --help / -h or no command
	if (
		!command ||
		command === "help" ||
		flags.help === "true" ||
		flags.h === "true"
	) {
		console.log(HELP);
		return;
	}

	try {
		// Create plugin runtime once
		const runtime = createPluginRuntime({
			registry: { "near-intents": { module: NearIntentsPlugin } },
		});

		// Load config once if needed
		const needsConfig = ["balances", "deposit", "swap", "transfer", "withdraw"];
		const config = needsConfig.includes(command) ? loadConfig() : null;

		// Create client once
		const { createClient } = await runtime.usePlugin("near-intents", {
			secrets: config?.privateKey ? { privateKey: config.privateKey } : {},
			variables: {},
		});
		const client = createClient();

		switch (command) {
			case "tokens": {
				const result = await client.tokensList({ search: flags.search });

				if (result.tokens.length === 0) {
					console.log("No tokens found");
					return;
				}

				const headers = [
					"Symbol",
					"Blockchain",
					"Token ID",
					"Decimals",
					"Price USD",
				];
				const rows = result.tokens.map(
					(t: {
						symbol: string;
						blockchain: string;
						intentsTokenId: string;
						decimals: number;
						priceUSD: string;
					}) => [
						t.symbol,
						t.blockchain,
						t.intentsTokenId,
						String(t.decimals),
						t.priceUSD,
					],
				);
				console.log(formatTable(headers, rows));
				console.log(`\nTotal: ${result.tokens.length} tokens`);
				break;
			}

			case "balances": {
				if (!config) throw new Error("Config required for this command");

				const result = await client.balancesGet({
					walletAddress: config.walletAddress,
				});

				if (result.balances.length === 0) {
					console.log("No balances found");
					return;
				}

				const headers = ["Symbol", "Blockchain", "Balance"];
				const rows = result.balances.map(
					(b: {
						symbol: string;
						blockchain: string;
						balanceFormatted: string;
					}) => [b.symbol, b.blockchain, b.balanceFormatted],
				);
				console.log(`Wallet: ${config.walletAddress}\n`);
				console.log(formatTable(headers, rows));
				break;
			}

			case "deposit": {
				if (!config) throw new Error("Config required for this command");

				const token = await resolveToken(
					flags.token,
					flags.blockchain,
					"--blockchain",
				);
				const result = await client.depositAddress({
					assetId: token.defuseAssetIdentifier,
				});

				console.log(`Token: ${token.symbol} (${token.blockchain})`);
				console.log(`Deposit Address: ${result.address}`);
				console.log(
					`\nMin deposit: ${token.minDepositAmountFormatted} ${token.symbol}`,
				);
				break;
			}

			case "swap": {
				if (!config) throw new Error("Config required for this command");

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

				const fromToken = await resolveToken(
					fromSymbol,
					fromChain,
					"--from-chain",
				);
				const toToken = await resolveToken(toSymbol, toChain, "--to-chain");

				console.log(`Getting quote...`);
				console.log(
					`From: ${amount} ${fromToken.symbol} (${fromToken.blockchain})`,
				);
				console.log(`To: ${toToken.symbol} (${toToken.blockchain})`);

				const quoteResult = await client.swapQuote({
					walletAddress: config.walletAddress,
					fromTokenId: fromToken.intentsTokenId,
					toTokenId: toToken.intentsTokenId,
					amount,
				});

				if (quoteResult.status === "error") {
					throw new Error(quoteResult.message);
				}

				const successfulQuote = quoteResult as Exclude<
					typeof quoteResult,
					{ status: "error" }
				>;

				console.log(`\nQuote received:`);
				console.log(
					`  Amount in: ${quoteResult.amountInFormatted} ${fromToken.symbol}`,
				);
				console.log(
					`  Amount out: ${quoteResult.amountOutFormatted} ${toToken.symbol}`,
				);
				console.log(
					`  Rate: 1 ${fromToken.symbol} = ${quoteResult.exchangeRate} ${toToken.symbol}`,
				);

				if (dryRun) {
					console.log(`\n(Dry run - swap not executed)`);
					return;
				}

				console.log(`\nExecuting swap...`);

				if (!successfulQuote.quote) {
					throw new Error("Quote not available");
				}

				const result = await client.swapExecute({
					walletAddress: config.walletAddress,
					quote: successfulQuote.quote,
				});

				console.log(`\nSwap submitted!`);
				if (result.status === "success") {
					console.log(`Transaction: ${result.txHash}`);
					console.log(`Explorer: ${result.explorerLink}`);
				} else {
					console.log(`Error: ${result.message}`);
				}
				break;
			}

			case "transfer": {
				if (!config) throw new Error("Config required for this command");

				const toAddress = flags.to;
				const amount = flags.amount;
				const symbol = flags.token;
				const blockchain = flags.blockchain;
				const dryRun = flags["dry-run"] === "true";

				if (!toAddress) throw new Error("--to is required");
				if (!amount) throw new Error("--amount is required");
				if (!symbol) throw new Error("--token is required");

				const token = await resolveToken(symbol, blockchain, "--blockchain");

				console.log(`Getting transfer quote...`);
				console.log(`Token: ${token.symbol} (${token.blockchain})`);
				console.log(`Amount: ${amount}`);
				console.log(`Destination: ${toAddress}`);

				const quoteResult = await client.transferQuote({
					walletAddress: config.walletAddress,
					tokenId: token.intentsTokenId,
					amount,
					decimals: token.decimals,
					toAddress,
				});

				if (quoteResult.status === "error") {
					throw new Error(quoteResult.message);
				}

				console.log(`\nTransfer details:`);
				console.log(`  Amount: ${quoteResult.amountFormatted} ${token.symbol}`);
				console.log(`  Fee: 0 (internal transfer)`);
				console.log(
					`  Recipient receives: ${quoteResult.amountFormatted} ${token.symbol}`,
				);

				if (dryRun) {
					console.log(`\n(Dry run - transfer not executed)`);
					return;
				}

				if (!quoteResult.amount) {
					throw new Error("Amount not available in transfer quote");
				}

				console.log(`\nExecuting transfer...`);

				const result = await client.transferExecute({
					tokenId: token.intentsTokenId,
					amount: quoteResult.amount,
					toAddress,
				});

				console.log(`\nTransfer submitted!`);
				if (result.status === "success") {
					console.log(`Transaction: ${result.txHash}`);
					console.log(`Explorer: ${result.explorerLink}`);
				} else {
					console.log(`Error: ${result.message}`);
				}
				break;
			}

			case "withdraw": {
				if (!config) throw new Error("Config required for this command");

				const toAddress = flags.to;
				const amount = flags.amount;
				const symbol = flags.token;
				const blockchain = flags.blockchain;
				const dryRun = flags["dry-run"] === "true";

				if (!toAddress) throw new Error("--to is required");
				if (!amount) throw new Error("--amount is required");
				if (!symbol) throw new Error("--token is required");

				showFeeNotice();

				const token = await resolveToken(symbol, blockchain, "--blockchain");

				console.log(`Getting withdrawal quote...`);
				console.log(`Token: ${token.symbol} (${token.blockchain})`);
				console.log(`Amount: ${amount}`);
				console.log(`Destination: ${toAddress}`);

				const quoteResult = await client.withdrawQuote({
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
				console.log(
					`  Fee: ${quoteResult.transferFeeFormatted} ${token.symbol}`,
				);
				console.log(
					`  You receive: ${quoteResult.receivedAmountFormatted} ${token.symbol}`,
				);

				if (dryRun) {
					console.log(`\n(Dry run - withdrawal not executed)`);
					return;
				}

				console.log(`\nExecuting withdrawal...`);

				if (!quoteResult.quote) {
					throw new Error("Quote not available");
				}

				const result = await client.withdrawExecute({
					walletAddress: config.walletAddress,
					quote: quoteResult.quote,
				});

				console.log(`\nWithdrawal submitted!`);
				if (result.status === "success") {
					console.log(`Transaction: ${result.txHash}`);
					console.log(`Explorer: ${result.explorerLink}`);
				} else {
					console.log(`Error: ${result.message}`);
				}
				break;
			}

			case "config": {
				flags._subcommand = positional[0];
				flags._key = positional[1];
				flags._value = positional[2];
				const { configCommand } = await import("./commands/config");
				await configCommand(flags);
				break;
			}

			default:
				console.error(`Unknown command: ${command}`);
				console.log(HELP);
				process.exit(1);
		}
	} catch (error) {
		console.error(`Error: ${error instanceof Error ? error.message : error}`);
		process.exit(1);
	}
}

main();
