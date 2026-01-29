import "dotenv/config";
import { balancesCommand } from "./commands/balances";
import { configCommand } from "./commands/config";
import { depositCommand } from "./commands/deposit";
import { swapCommand } from "./commands/swap";
import { tokensCommand } from "./commands/tokens";
import { withdrawCommand } from "./commands/withdraw";
import { loadConfig } from "./config";

const VERSION = "0.1.0";

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
${COLORS.bright}${COLORS.cyan}Near Intents CLI${COLORS.reset} v${VERSION}
Cross-chain token swaps via intent-based execution.

${COLORS.yellow}API KEY:${COLORS.reset}
  Get free key: ${COLORS.green}https://partners.near-intents.org/${COLORS.reset}
  Without key: 0.1% swap fee
  Set: near-intents config set api-key <key>

${COLORS.bright}${COLORS.cyan}COMMANDS:${COLORS.reset}
  ${COLORS.green}tokens${COLORS.reset}      List/search supported tokens
  ${COLORS.green}balances${COLORS.reset}   Show wallet balances
  ${COLORS.green}deposit${COLORS.reset}    Get deposit address
  ${COLORS.green}swap${COLORS.reset}       Execute token swap
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
  near-intents config generate-key
  near-intents config set api-key YOUR_KEY
  near-intents tokens --search USDC
  near-intents balances
  near-intents deposit --token USDC --blockchain eth
  near-intents swap --from USDC --to NEAR --amount 100
  near-intents swap --from USDC --to NEAR --amount 100 --dry-run
  near-intents withdraw --to 0x123... --amount 50 --token USDC --blockchain eth

${COLORS.bright}${COLORS.cyan}EXIT CODES:${COLORS.reset}
  0  Success
  1  Error (invalid args, API error, etc.)
`;

function parseArgs(args: string[]): {
	command: string;
	flags: Record<string, string>;
	positional: string[];
} {
	const flags: Record<string, string> = {};
	const positional: string[] = [];
	let command = "";

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg.startsWith("--")) {
			const key = arg.slice(2);
			const value = args[i + 1];
			if (value && !value.startsWith("-")) {
				flags[key] = value;
				i++;
			} else {
				flags[key] = "true";
			}
		} else if (arg.startsWith("-")) {
			// Short flags like -h, -v
			const key = arg.slice(1);
			flags[key] = "true";
		} else if (!command) {
			command = arg;
		} else {
			positional.push(arg);
		}
	}

	return { command, flags, positional };
}

async function main() {
	const args = process.argv.slice(2);
	const { command, flags, positional } = parseArgs(args);

	// Handle --version / -v
	if (flags.version === "true" || flags.v === "true") {
		console.log(`near-intents v${VERSION}`);
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
		switch (command) {
			case "tokens":
				await tokensCommand(flags);
				break;

			case "balances": {
				const config = loadConfig();
				await balancesCommand(config);
				break;
			}

			case "deposit": {
				const config = loadConfig();
				await depositCommand(config, flags);
				break;
			}

			case "swap": {
				const config = loadConfig();
				await swapCommand(config, flags);
				break;
			}

			case "withdraw": {
				const config = loadConfig();
				await withdrawCommand(config, flags);
				break;
			}

			case "config": {
				// Parse config subcommand: config set api-key <value>
				// positional[0] = subcommand (set/get/clear)
				// positional[1] = key (api-key/private-key)
				// positional[2] = value
				flags._subcommand = positional[0];
				flags._key = positional[1];
				flags._value = positional[2];
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
