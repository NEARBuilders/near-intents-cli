import "dotenv/config";

import { createPluginRuntime } from "every-plugin";
import { version } from "../package.json";
import { hasApiKey, loadConfig } from "./config";
import NearIntentsPlugin from "./every-plugin";
import { parseArgs } from "./utils/args";
import { styles } from "./utils/styles";
import { formatTable } from "./utils/table";
import { resolveToken } from "./utils/token";

const HELP = `
${styles.bold(styles.cyan("Near Intents CLI"))} ${styles.gray(`v${version}`)}
${styles.dim("Cross-chain token swaps via intent-based execution.")}

${styles.yellow("API KEY:")}
  ${styles.green("https://partners.near-intents.org/")}
  ${styles.dim("Without key: 0.1% swap fee")}
  Set: ${styles.cyan("near-intents-cli config set api-key <key>")}

${styles.bold(styles.cyan("COMMANDS:"))}
  ${styles.green("tokens")}      List/search supported tokens
  ${styles.green("balances")}   Show wallet balances
  ${styles.green("deposit")}    Get deposit address
  ${styles.green("swap")}       Execute token swap
  ${styles.green("transfer")}   Transfer to another near-intents account
  ${styles.green("withdraw")}   Withdraw to external address
  ${styles.green("config")}     Manage settings (api-key, private-key)

${styles.bold(styles.cyan("OPTIONS:"))}
  ${styles.green("--help, -h")}          Show help
  ${styles.green("--version, -v")}       Show version

${styles.bold(styles.cyan("COMMAND OPTIONS:"))}
  ${styles.green("tokens:")}
    ${styles.dim("--search <query")}            Filter tokens by search query

  ${styles.green("deposit:")}
    ${styles.dim("--token <symbol")}            Token symbol (required)
    ${styles.dim("--blockchain <chain")}        Blockchain (required if token exists on multiple chains)

  ${styles.green("swap:")}
    ${styles.dim("--from <symbol")}             Source token symbol (required)
    ${styles.dim("--from-chain <chain")}        Source blockchain
    ${styles.dim("--to <symbol")}               Destination token symbol (required)
    ${styles.dim("--to-chain <chain")}          Destination blockchain
    ${styles.dim("--amount <num")}              Amount to swap (required)
    ${styles.dim("--dry-run")}                   Show quote without executing

  ${styles.green("transfer:")}
    ${styles.dim("--to <address")}              Destination near-intents address (required)
    ${styles.dim("--amount <num")}              Amount to transfer (required)
    ${styles.dim("--token <symbol")}            Token symbol (required)
    ${styles.dim("--blockchain <chain")}        Blockchain (if token on multiple chains)
    ${styles.dim("--dry-run")}                   Show quote without executing

  ${styles.green("withdraw:")}
    ${styles.dim("--to <address")}              Destination address (required)
    ${styles.dim("--amount <num")}              Amount to withdraw (required)
    ${styles.dim("--token <symbol")}            Token symbol (required)
    ${styles.dim("--blockchain <chain")}        Blockchain (required if token exists on multiple chains)
    ${styles.dim("--dry-run")}                   Show quote without executing

  ${styles.green("config:")}
    ${styles.dim("set api-key <key")}           Save API key
    ${styles.dim("set private-key <key")}       Save private key
    ${styles.dim("generate-key")}                Generate new NEAR key pair
    ${styles.dim("get")}                         Show current config
    ${styles.dim("clear")}                       Remove config file

${styles.bold(styles.cyan("EXAMPLES:"))}
  ${styles.gray("near-intents-cli config generate-key")}
  ${styles.gray("near-intents-cli config set api-key YOUR_KEY")}
  ${styles.gray("near-intents-cli tokens --search USDC")}
  ${styles.gray("near-intents-cli balances")}
  ${styles.gray("near-intents-cli deposit --token USDC --blockchain eth")}
  ${styles.gray("near-intents-cli swap --from USDC --to NEAR --amount 100")}
  ${styles.gray("near-intents-cli swap --from USDC --to NEAR --amount 100 --dry-run")}
  ${styles.gray("near-intents-cli transfer --to 0x... --amount 50 --token USDC")}
  ${styles.gray("near-intents-cli withdraw --to 0x123... --amount 50 --token USDC --blockchain eth")}

${styles.bold(styles.cyan("EXIT CODES:"))}
  0  ${styles.green("Success")}
  1  ${styles.red("Error (invalid args, API error, etc.)")}
`;

function showFeeNotice() {
	if (!hasApiKey()) {
		console.log(
			`\n${styles.warning("No API key configured. Swaps incur 0.1% fee.")}`,
		);
		console.log(
			styles.green("Get free key: https://partners.near-intents.org/"),
		);
		console.log(
			styles.dim("Run: ") +
				styles.cyan("near-intents-cli config set api-key <your-key>") +
				"\n",
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
					console.log(styles.warning("No tokens found"));
					return;
				}

				const columns = [
					{ key: "symbol", header: "Symbol", color: "cyan" as const },
					{ key: "blockchain", header: "Blockchain", color: "cyan" as const },
					{ key: "intentsTokenId", header: "Token ID", color: "cyan" as const },
					{ key: "decimals", header: "Decimals", color: "cyan" as const },
					{ key: "priceUSD", header: "Price USD", color: "cyan" as const },
				];
				console.log(formatTable(columns, result.tokens));
				console.log(styles.dim(`\nTotal: ${result.tokens.length} tokens`));
				break;
			}

			case "balances": {
				if (!config) throw new Error("Config required for this command");

				const result = await client.balancesGet({
					walletAddress: config.walletAddress,
				});

				if (result.balances.length === 0) {
					console.log(styles.warning("No balances found"));
					return;
				}

				const columns = [
					{ key: "symbol", header: "Symbol", color: "cyan" as const },
					{ key: "blockchain", header: "Blockchain", color: "cyan" as const },
					{
						key: "balanceFormatted",
						header: "Balance",
						color: "cyan" as const,
					},
				];
				console.log(`${styles.cyan(`Wallet: ${config.walletAddress}`)}\n`);
				console.log(formatTable(columns, result.balances));
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

				console.log(`\n${styles.ruler(" deposit info ", "cyan")}`);
				console.log(
					styles.keyValuePair("Token", `${token.symbol} (${token.blockchain})`),
				);
				console.log(styles.keyValuePair("Deposit Address", result.address));
				console.log(
					styles.keyValuePair(
						"Min deposit",
						`${token.minDepositAmountFormatted} ${token.symbol}`,
						"cyan",
						"yellow",
					),
				);
				console.log("");
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

				console.log(styles.dim("Getting quote..."));
				console.log(
					styles.keyValuePair(
						"From",
						`${amount} ${fromToken.symbol} (${fromToken.blockchain})`,
					),
				);
				console.log(
					styles.keyValuePair(
						"To",
						`${toToken.symbol} (${toToken.blockchain})`,
					),
				);

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

				console.log(`\n${styles.ruler(" quote ", "green")}`);
				console.log(
					styles.keyValuePair(
						"Amount in",
						`${quoteResult.amountInFormatted} ${fromToken.symbol}`,
						"cyan",
						"green",
					),
				);
				console.log(
					styles.keyValuePair(
						"Amount out",
						`${quoteResult.amountOutFormatted} ${toToken.symbol}`,
						"cyan",
						"green",
					),
				);
				console.log(
					styles.keyValuePair(
						"Rate",
						`1 ${fromToken.symbol} = ${quoteResult.exchangeRate} ${toToken.symbol}`,
						"cyan",
						"white",
					),
				);

				if (dryRun) {
					console.log(`\n${styles.warning("(Dry run - swap not executed)")}`);
					return;
				}

				console.log(styles.dim("\nExecuting swap..."));

				if (!successfulQuote.quote) {
					throw new Error("Quote not available");
				}

				const result = await client.swapExecute({
					walletAddress: config.walletAddress,
					quote: successfulQuote.quote,
				});

				console.log(`\n${styles.ruler(" result ", "cyan")}`);
				if (result.status === "success") {
					console.log(styles.success("Swap submitted!"));
					console.log(styles.keyValuePair("Transaction", result.txHash));
					console.log(styles.keyValuePair("Explorer", result.explorerLink));
				} else {
					console.log(styles.error(result.message || "Transaction failed"));
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

				console.log(styles.dim("Getting transfer quote..."));
				console.log(
					styles.keyValuePair("Token", `${token.symbol} (${token.blockchain})`),
				);
				console.log(styles.keyValuePair("Amount", amount));
				console.log(styles.keyValuePair("Destination", toAddress));

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

				console.log(`\n${styles.ruler(" transfer details ", "green")}`);
				console.log(
					styles.keyValuePair(
						"Amount",
						`${quoteResult.amountFormatted} ${token.symbol}`,
						"cyan",
						"green",
					),
				);
				console.log(
					styles.keyValuePair("Fee", "0 (internal transfer)", "cyan", "green"),
				);
				console.log(
					styles.keyValuePair(
						"Recipient receives",
						`${quoteResult.amountFormatted} ${token.symbol}`,
						"cyan",
						"green",
					),
				);

				if (dryRun) {
					console.log(
						`\n${styles.warning("(Dry run - transfer not executed)")}`,
					);
					return;
				}

				if (!quoteResult.amount) {
					throw new Error("Amount not available in transfer quote");
				}

				console.log(styles.dim("\nExecuting transfer..."));

				const result = await client.transferExecute({
					tokenId: token.intentsTokenId,
					amount: quoteResult.amount,
					toAddress,
				});

				console.log(`\n${styles.ruler(" result ", "cyan")}`);
				if (result.status === "success") {
					console.log(styles.success("Transfer submitted!"));
					console.log(styles.keyValuePair("Transaction", result.txHash));
					console.log(styles.keyValuePair("Explorer", result.explorerLink));
				} else {
					console.log(styles.error(result.message || "Transfer failed"));
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

				console.log(styles.dim("Getting withdrawal quote..."));
				console.log(
					styles.keyValuePair("Token", `${token.symbol} (${token.blockchain})`),
				);
				console.log(styles.keyValuePair("Amount", amount));
				console.log(styles.keyValuePair("Destination", toAddress));

				const result = await client.withdrawQuote({
					walletAddress: config.walletAddress,
					destinationAddress: toAddress,
					assetId: token.intentsTokenId,
					amount,
					decimals: token.decimals,
				});

				if (result.status === "error") {
					throw new Error(result.message);
				}

				console.log(`\n${styles.ruler(" quote ", "green")}`);
				console.log(
					styles.keyValuePair(
						"Amount",
						`${result.amountFormatted} ${token.symbol}`,
						"cyan",
						"green",
					),
				);
				console.log(
					styles.keyValuePair(
						"Fee",
						`${result.transferFeeFormatted} ${token.symbol}`,
						"cyan",
						"yellow",
					),
				);
				console.log(
					styles.keyValuePair(
						"You receive",
						`${result.receivedAmountFormatted} ${token.symbol}`,
						"cyan",
						"green",
					),
				);

				if (dryRun) {
					console.log(
						`\n${styles.warning("(Dry run - withdrawal not executed)")}`,
					);
					return;
				}

				console.log(styles.dim("\nExecuting withdrawal..."));

				if (!result.quote) {
					throw new Error("Quote not available");
				}

				const withdrawResult = await client.withdrawExecute({
					walletAddress: config.walletAddress,
					quote: result.quote,
				});

				console.log(`\n${styles.ruler(" result ", "cyan")}`);
				if (withdrawResult.status === "success") {
					console.log(styles.success("Withdrawal submitted!"));
					console.log(
						styles.keyValuePair("Transaction", withdrawResult.txHash),
					);
					console.log(
						styles.keyValuePair("Explorer", withdrawResult.explorerLink),
					);
				} else {
					console.log(
						styles.error(withdrawResult.message || "Withdraw failed"),
					);
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
		console.error(
			styles.error(`Error: ${error instanceof Error ? error.message : error}`),
		);
		process.exit(1);
	}
}

main();
