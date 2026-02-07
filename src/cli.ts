import "dotenv/config";
import { pathToFileURL } from "node:url";
import { balancesCommand } from "./commands/balances";
import { configCommand } from "./commands/config";
import { depositCommand } from "./commands/deposit";
import { swapCommand } from "./commands/swap";
import { tokensCommand } from "./commands/tokens";
import { transferCommand } from "./commands/transfer";
import { withdrawCommand } from "./commands/withdraw";
import { resolveCliMode } from "./cli-mode";
import { getPreferredMode, loadConfig, setPreferredMode } from "./config";
import { runHumanSession } from "./human/session";
import { buildCliHelp } from "./utils/terminal-ui";
import { version } from "../package.json";

const HELP = buildCliHelp(version);
const BOOLEAN_FLAGS = new Set([
	"help",
	"version",
	"human",
	"agent",
	"interactive",
	"dry-run",
]);

export function parseArgs(args: string[]): {
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
			if (!BOOLEAN_FLAGS.has(key) && value && !value.startsWith("-")) {
				flags[key] = value;
				i++;
			} else {
				flags[key] = "true";
			}
		} else if (arg.startsWith("-")) {
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

export async function runOneShotCommand(
	command: string,
	flags: Record<string, string>,
	positional: string[],
): Promise<void> {
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

		case "transfer": {
			const config = loadConfig();
			await transferCommand(config, flags);
			break;
		}

		case "withdraw": {
			const config = loadConfig();
			await withdrawCommand(config, flags);
			break;
		}

		case "config": {
			flags._subcommand = positional[0];
			flags._key = positional[1];
			flags._value = positional[2];
			await configCommand(flags);
			break;
		}

		default:
			throw new Error(`Unknown command: ${command}`);
	}
}

function getExplicitMode(flags: Record<string, string>): "human" | "agent" | undefined {
	if (flags.human === "true") {
		return "human";
	}
	if (flags.agent === "true") {
		return "agent";
	}
	return undefined;
}

export async function runCli(args: string[]): Promise<void> {
	const { command, flags, positional } = parseArgs(args);

	if (flags.version === "true" || flags.v === "true") {
		console.log(`near-intents-cli v${version}`);
		return;
	}

	const mode = resolveCliMode(flags, getPreferredMode());
	const explicitMode = getExplicitMode(flags);
	if (explicitMode) {
		setPreferredMode(explicitMode);
	}

	if (flags.human === "true") {
		if (command) {
			throw new Error("--human mode does not accept direct command arguments");
		}
		await runHumanSession();
		return;
	}

	if (command === "help" || flags.help === "true" || flags.h === "true") {
		console.log(HELP);
		return;
	}

	if (!command) {
		if (mode === "human") {
			await runHumanSession();
			return;
		}
		console.log(HELP);
		return;
	}

	await runOneShotCommand(command, flags, positional);
}

function isMainModule(): boolean {
	if (!process.argv[1]) {
		return false;
	}
	return import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
	runCli(process.argv.slice(2)).catch((error) => {
		if (error instanceof Error && error.message.startsWith("Unknown command:")) {
			console.error(error.message);
			console.log(HELP);
			process.exit(1);
		}

		console.error(`Error: ${error instanceof Error ? error.message : error}`);
		process.exit(1);
	});
}
