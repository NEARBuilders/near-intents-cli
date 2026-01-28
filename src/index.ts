import "dotenv/config";
import { balancesCommand } from "./commands/balances";
import { depositCommand } from "./commands/deposit";
import { swapCommand } from "./commands/swap";
import { tokensCommand } from "./commands/tokens";
import { withdrawCommand } from "./commands/withdraw";
import { loadConfig } from "./config";
import { parseArgs } from "./utils/token";

const HELP = `
NEAR Intents CLI

Usage: pnpm cli <command> [options]

Commands:
  tokens                        List all supported tokens
  balances                      Show your token balances
  deposit                       Get deposit address for a token
  swap                          Execute a token swap
  withdraw                      Withdraw tokens to external address

Options:
  tokens:
    --search <query>            Filter tokens by search query

  deposit:
    --token <symbol>            Token symbol (required)
    --blockchain <chain>        Blockchain (required if token exists on multiple chains)

  swap:
    --from <symbol>             Source token symbol (required)
    --from-chain <chain>        Source blockchain
    --to <symbol>               Destination token symbol (required)
    --to-chain <chain>          Destination blockchain
    --amount <num>              Amount to swap (required)
    --dry-run                   Show quote without executing

  withdraw:
    --to <address>              Destination address (required)
    --amount <num>              Amount to withdraw (required)
    --token <symbol>            Token symbol (required)
    --blockchain <chain>        Blockchain (required if token exists on multiple chains)
    --dry-run                   Show quote without executing

Environment:
  NEAR_PRIVATE_KEY              Your NEAR private key (ed25519:xxxx format)

Examples:
  pnpm cli tokens
  pnpm cli tokens --search USDC
  pnpm cli balances
  pnpm cli deposit --token USDC --blockchain eth
  pnpm cli swap --from USDC --to NEAR --amount 100
  pnpm cli swap --from USDC --to NEAR --amount 100 --dry-run
  pnpm cli withdraw --to 0x123... --amount 50 --token USDC --blockchain eth
  pnpm cli withdraw --to 0x123... --amount 50 --token USDC --dry-run
`;

async function main() {
  const args = process.argv.slice(2);
  const { command, flags } = parseArgs(args);

  if (!command || command === "help" || flags.help) {
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
