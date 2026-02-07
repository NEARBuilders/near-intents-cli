const ANSI = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	cyan: "\x1b[36m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	blue: "\x1b[34m",
	white: "\x1b[37m",
};

function paint(text: string, ...codes: string[]): string {
	return `${codes.join("")}${text}${ANSI.reset}`;
}

function chip(label: string, tone: "info" | "good" | "warn"): string {
	const color = tone === "info" ? ANSI.blue : tone === "good" ? ANSI.green : ANSI.yellow;
	return paint(`[${label}]`, ANSI.bold, color);
}

export function divider(char = "-"): string {
	return paint(char.repeat(72), ANSI.dim);
}

function section(title: string, lines: string[]): string {
	return [
		paint(title.toUpperCase(), ANSI.bold, ANSI.cyan),
		...lines,
	].join("\n");
}

export function buildCliHelp(version: string): string {
	return [
		`${paint("Near Intents CLI", ANSI.bold, ANSI.white)} ${paint(`v${version}`, ANSI.dim)}`,
		paint("Cross-chain token swaps via intent-based execution.", ANSI.dim),
		divider("="),
		section("API Key", [
			`  ${chip("FREE", "good")} ${paint("https://partners.near-intents.org/", ANSI.green)}`,
			"  Without key: 0.1% swap/withdraw fee",
			"  Set: near-intents-cli config set api-key <key>",
		]),
		"",
		section("Commands", [
			"  tokens      List/search supported tokens",
			"  balances    Show wallet balances",
			"  deposit     Get deposit address",
			"  swap        Execute token swap",
			"  transfer    Transfer to another near-intents account",
			"  withdraw    Withdraw to external address",
			"  config      Manage settings (api-key, private-key, preferred-mode)",
		]),
		"",
		section("Global Options", [
			"  --help, -h          Show help",
			"  --version, -v       Show version",
			"  --human             Start persistent interactive mini app",
			"  --agent             Force strict one-shot command mode",
		]),
		"",
		section("Mode Persistence", [
			"  --human saves preferred-mode=human",
			"  --agent saves preferred-mode=agent",
			"  Commandless launch uses preferred mode",
			"  Default when unset: agent behavior",
		]),
		"",
		section("Command Options", [
			"  tokens: --search <query>",
			"  deposit: --token <symbol> --blockchain <chain> [--interactive]",
			"  swap: --from <symbol> --to <symbol> --amount <num> [--from-chain] [--to-chain] [--interactive] [--dry-run]",
			"  transfer: --to <address> --amount <num> --token <symbol> [--blockchain] [--interactive] [--dry-run]",
			"  withdraw: --to <address> --amount <num> --token <symbol> [--blockchain] [--interactive] [--dry-run]",
			"  config: set api-key|private-key|preferred-mode <value>, generate-wallet, get, clear",
		]),
		"",
		section("Examples", [
			"  near-intents-cli",
			"  near-intents-cli --human",
			"  near-intents-cli --agent balances",
			"  near-intents-cli config set preferred-mode human",
			"  near-intents-cli swap --from USDC --to NEAR --amount 100 --dry-run",
		]),
		"",
		section("Exit Codes", ["  0 Success", "  1 Error"]),
	].join("\n");
}

export function formatHumanHeader(input: {
	walletAddress?: string;
	hasApiKey: boolean;
	preferredMode?: "human" | "agent";
}): string {
	return [
		"",
		paint("Near Intents CLI / HUMAN MODE", ANSI.bold, ANSI.cyan),
		divider(),
		`${chip(input.preferredMode ?? "agent(default)", "info")} ${paint("startup mode", ANSI.dim)}`,
		`${chip(input.walletAddress ?? "not configured", input.walletAddress ? "good" : "warn")} ${paint("wallet", ANSI.dim)}`,
		`${chip(input.hasApiKey ? "configured" : "missing", input.hasApiKey ? "good" : "warn")} ${paint("api key", ANSI.dim)}`,
		paint("Use arrow keys + Enter. Press Ctrl+C to exit.", ANSI.dim),
		divider(),
	].join("\n");
}

export function formatHumanHelp(): string {
	return [
		"",
		paint("Human mode actions", ANSI.bold, ANSI.cyan),
		"  swap       Interactive swap flow",
		"  transfer   Interactive internal transfer flow",
		"  withdraw   Interactive withdraw flow",
		"  deposit    Interactive deposit flow",
		"  balances   Show wallet balances",
		"  tokens     List/search supported tokens",
		"  config     Manage API/private keys and mode",
		"  help       Show this help",
		"  exit       Exit human mode",
		"",
	].join("\n");
}

export function formatHumanExit(): string {
	return `\n${paint("Session closed.", ANSI.bold, ANSI.cyan)}`;
}

export function formatHumanError(message: string): string {
	return paint(`Error: ${message}`, ANSI.bold, ANSI.red);
}
