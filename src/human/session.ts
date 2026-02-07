import { balancesCommand } from "../commands/balances";
import { configCommand } from "../commands/config";
import { depositCommand } from "../commands/deposit";
import { swapCommand } from "../commands/swap";
import { tokensCommand } from "../commands/tokens";
import { transferCommand } from "../commands/transfer";
import { withdrawCommand } from "../commands/withdraw";
import readline from "node:readline";
import {
	getApiKey,
	getPreferredMode,
	loadConfig,
	tryLoadConfig,
} from "../config";
import {
	formatHumanError,
	formatHumanExit,
	formatHumanHeader,
	formatHumanHelp,
} from "../utils/terminal-ui";

type HumanAction =
	| "swap"
	| "transfer"
	| "withdraw"
	| "deposit"
	| "balances"
	| "tokens"
	| "config"
	| "help"
	| "exit";

type ConfigAction =
	| "get"
	| "set-api-key"
	| "set-private-key"
	| "generate-wallet"
	| "clear"
	| "back";

interface PromptModule {
	input: (options: {
		message: string;
		default?: string;
		validate?: (value: string) => true | string;
	}, context?: PromptContext) => Promise<string>;
	select: <T>(options: {
		message: string;
		choices: Array<{ name: string; value: T }>;
		pageSize?: number;
	}, context?: PromptContext) => Promise<T>;
	confirm: (
		options: { message: string; default?: boolean },
		context?: PromptContext,
	) => Promise<boolean>;
}

interface PromptContext {
	input?: NodeJS.ReadableStream;
	output?: NodeJS.WritableStream;
	clearPromptOnDone?: boolean;
}

let promptModulePromise: Promise<PromptModule> | null = null;
let isHumanSessionRunning = false;

class HumanSessionExit extends Error {
	constructor() {
		super("Human session closed");
	}
}

class PromptEscaped extends Error {
	public readonly streak: number;

	constructor(streak: number) {
		super("Prompt escaped");
		this.streak = streak;
	}
}

const ESC_WINDOW_MS = 1500;
let escStreak = 0;
let lastEscAt = 0;

function registerEsc(): number {
	const now = Date.now();
	if (now - lastEscAt <= ESC_WINDOW_MS) {
		escStreak += 1;
	} else {
		escStreak = 1;
	}
	lastEscAt = now;
	return escStreak;
}

function resetEsc(): void {
	escStreak = 0;
	lastEscAt = 0;
}

function getPromptContext(): PromptContext {
	return {
		input: process.stdin,
		output: process.stdout,
		clearPromptOnDone: false,
	};
}

async function selectWithArrows<T>(options: {
	message: string;
	choices: Array<{ name: string; value: T }>;
}): Promise<T> {
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		throw new Error("--human requires a TTY terminal");
	}

	const output = process.stdout;
	const input = process.stdin;
	const choices = options.choices;
	let selectedIndex = 0;
	let renderedLines = 0;
	const wasRawMode = input.isRaw;

	readline.emitKeypressEvents(input);
	input.setRawMode?.(true);

	const clearPreviousRender = () => {
		if (renderedLines <= 0) return;
		readline.moveCursor(output, 0, -renderedLines);
		readline.cursorTo(output, 0);
		readline.clearScreenDown(output);
	};

	const render = () => {
		clearPreviousRender();
		const lines = [
			`? ${options.message}`,
			...choices.map((choice, index) =>
				index === selectedIndex ? `❯ ${choice.name}` : `  ${choice.name}`,
			),
		];
		output.write(`${lines.join("\n")}\n`);
		renderedLines = lines.length;
	};

	return await new Promise<T>((resolve, reject) => {
		const cleanup = () => {
			input.off("keypress", onKeypress);
			input.setRawMode?.(Boolean(wasRawMode));
		};

		const onKeypress = (_str: string, key: { name?: string; ctrl?: boolean }) => {
			if (key.ctrl && key.name === "c") {
				cleanup();
				output.write("\n");
				reject(new HumanSessionExit());
				return;
			}

			if (key.name === "up") {
				selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : choices.length - 1;
				render();
				return;
			}

			if (key.name === "down") {
				selectedIndex = (selectedIndex + 1) % choices.length;
				render();
				return;
			}

			if (key.name === "escape") {
				cleanup();
				output.write("\n");
				reject(new PromptEscaped(registerEsc()));
				return;
			}

			if (key.name === "return" || key.name === "enter") {
				cleanup();
				resetEsc();
				resolve(choices[selectedIndex].value);
			}
		};

		input.on("keypress", onKeypress);
		render();
	});
}

async function getPrompts(): Promise<PromptModule> {
	if (!promptModulePromise) {
		promptModulePromise = import("@inquirer/prompts") as Promise<PromptModule>;
	}
	return promptModulePromise;
}

function isPromptExit(error: unknown): boolean {
	return (
		error instanceof Error &&
		(error.name === "ExitPromptError" ||
			error.message.includes("force closed") ||
			error.message.includes("SIGINT"))
	);
}

async function promptWithExit<T>(fn: () => Promise<T>): Promise<T> {
	try {
		const result = await fn();
		resetEsc();
		return result;
	} catch (error) {
		if (isPromptExit(error)) {
			if (
				error instanceof Error &&
				(error.message.includes("SIGINT") || error.name === "AbortError")
			) {
				throw new HumanSessionExit();
			}
			const streak = registerEsc();
			throw new PromptEscaped(streak);
		}
		if (error instanceof PromptEscaped) {
			throw new HumanSessionExit();
		}
		throw error;
	}
}

function printSessionHeader() {
	const config = tryLoadConfig();
	const apiKey = getApiKey();
	const preferredMode = getPreferredMode();
	console.log(
		formatHumanHeader({
			walletAddress: config?.walletAddress,
			hasApiKey: !!apiKey,
			preferredMode,
		}),
	);
}

function printHumanHelp() {
	console.log(formatHumanHelp());
}

function requireConfigOrThrow() {
	try {
		return loadConfig();
	} catch {
		throw new Error(
			"Private key is not configured. Open 'config' in human mode and run 'generate-wallet' or set private-key.",
		);
	}
}

async function runConfigMenu() {
	const { input, confirm } = await getPrompts();

	while (true) {
		let action: ConfigAction;
		try {
			action = await selectWithArrows<ConfigAction>({
				message: "Config actions",
				choices: [
					{ name: "Get current config", value: "get" },
					{ name: "Set API key", value: "set-api-key" },
					{ name: "Set private key", value: "set-private-key" },
					{ name: "Generate new wallet", value: "generate-wallet" },
					{ name: "Clear config", value: "clear" },
					{ name: "Back", value: "back" },
				],
			});
		} catch (error) {
			if (error instanceof PromptEscaped) {
				if (error.streak >= 2) {
					throw new HumanSessionExit();
				}
				console.log("Back.");
				return;
			}
			throw error;
		}

		switch (action) {
			case "get":
				await configCommand({ _subcommand: "get" });
				break;
			case "set-api-key": {
				const apiKey = await promptWithExit(() =>
					input({
						message: "Enter API key",
						validate: (value) =>
							value.trim().length > 0 ? true : "API key is required",
					}, getPromptContext()),
				);
				await configCommand({
					_subcommand: "set",
					_key: "api-key",
					_value: apiKey.trim(),
				});
				break;
			}
			case "set-private-key": {
				const privateKey = await promptWithExit(() =>
					input({
						message: "Enter private key",
						validate: (value) =>
							value.trim().length > 0 ? true : "Private key is required",
					}, getPromptContext()),
				);
				await configCommand({
					_subcommand: "set",
					_key: "private-key",
					_value: privateKey.trim(),
				});
				break;
			}
			case "generate-wallet":
				await configCommand({ _subcommand: "generate-wallet" });
				break;
			case "clear": {
				const accepted = await promptWithExit(() =>
					confirm({
						message: "Clear config file?",
						default: false,
					}, getPromptContext()),
				);
				if (accepted) {
					await configCommand({ _subcommand: "clear" });
				}
				break;
			}
			case "back":
				return;
		}
	}
}

async function runTokensFlow() {
	const { input, confirm } = await getPrompts();
	let useSearch: boolean;
	try {
		useSearch = await promptWithExit(() =>
			confirm({
				message: "Search tokens?",
				default: false,
			}, getPromptContext()),
		);
	} catch (error) {
		if (error instanceof PromptEscaped) {
			if (error.streak >= 2) {
				throw new HumanSessionExit();
			}
			console.log("Back.");
			return;
		}
		throw error;
	}

	if (!useSearch) {
		await tokensCommand({});
		return;
	}

	let query: string;
	try {
		query = await promptWithExit(() =>
			input({
				message: "Search query",
				validate: (value) =>
					value.trim().length > 0 ? true : "Search query is required",
			}, getPromptContext()),
		);
	} catch (error) {
		if (error instanceof PromptEscaped) {
			if (error.streak >= 2) {
				throw new HumanSessionExit();
			}
			console.log("Back.");
			return;
		}
		throw error;
	}

	await tokensCommand({ search: query.trim() });
}

async function runAction(action: HumanAction) {
	switch (action) {
		case "swap": {
			const config = requireConfigOrThrow();
			await swapCommand(config, { interactive: "true" });
			return true;
		}
		case "transfer": {
			const config = requireConfigOrThrow();
			await transferCommand(config, { interactive: "true" });
			return true;
		}
		case "withdraw": {
			const config = requireConfigOrThrow();
			await withdrawCommand(config, { interactive: "true" });
			return true;
		}
		case "deposit": {
			const config = requireConfigOrThrow();
			await depositCommand(config, { interactive: "true" });
			return true;
		}
		case "balances": {
			const config = requireConfigOrThrow();
			await balancesCommand(config);
			return true;
		}
		case "tokens":
			await runTokensFlow();
			return true;
		case "config":
			await runConfigMenu();
			return true;
		case "help":
			printHumanHelp();
			return true;
		case "exit":
			return false;
	}
}

export async function runHumanSession(): Promise<void> {
	if (isHumanSessionRunning) {
		return;
	}

	isHumanSessionRunning = true;
	try {
		const isTTY = process.stdin.isTTY && process.stdout.isTTY;
		if (!isTTY) {
			throw new Error("--human requires a TTY terminal");
		}

		printSessionHeader();

		while (true) {
			try {
				const action = await selectWithArrows<HumanAction>({
					message: "Choose an action",
					choices: [
						{ name: "Swap", value: "swap" },
						{ name: "Transfer", value: "transfer" },
						{ name: "Withdraw", value: "withdraw" },
						{ name: "Deposit", value: "deposit" },
						{ name: "Balances", value: "balances" },
						{ name: "Tokens", value: "tokens" },
						{ name: "Config", value: "config" },
						{ name: "Help", value: "help" },
						{ name: "Exit", value: "exit" },
					],
				});

				const shouldContinue = await runAction(action);
				if (!shouldContinue) {
					console.log(formatHumanExit());
					return;
				}
			} catch (error) {
				if (error instanceof PromptEscaped) {
					if (error.streak >= 2) {
						console.log(formatHumanExit());
						return;
					}
					console.log("Press Esc again quickly to exit.");
					continue;
				}
				if (error instanceof HumanSessionExit) {
					console.log(formatHumanExit());
					return;
				}

				console.error(
					formatHumanError(error instanceof Error ? error.message : String(error)),
				);
			}
		}
	} finally {
		isHumanSessionRunning = false;
		resetEsc();
	}
}
