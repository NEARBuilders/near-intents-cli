import { searchTokensBySymbol } from "../services/tokens";
import type { Token } from "../services/tokens/schema";

export async function resolveToken(
	symbol: string,
	blockchain?: string,
	flagName: string = "--blockchain",
): Promise<Token> {
	const matches = await searchTokensBySymbol(symbol, { exact: true });

	if (matches.length === 0) {
		throw new Error(`Token not found: ${symbol}`);
	}

	if (blockchain) {
		const filtered = matches.filter(
			(t) => t.blockchain.toLowerCase() === blockchain.toLowerCase(),
		);
		if (filtered.length === 0) {
			const chains = matches
				.map((t) => `${flagName} ${t.blockchain}`)
				.join(", ");
			throw new Error(
				`Token ${symbol} not found on ${blockchain}. Available on: ${chains}`,
			);
		}
		return filtered[0];
	}

	if (matches.length > 1) {
		const options = matches
			.map((t) => `  ${flagName} ${t.blockchain}`)
			.join("\n");
		throw new Error(
			`Multiple tokens found for ${symbol}. Specify ${flagName}:\n${options}`,
		);
	}

	return matches[0];
}

export function formatTable(headers: string[], rows: string[][]): string {
	const colWidths = headers.map((h, i) =>
		Math.max(h.length, ...rows.map((r) => (r[i] || "").length)),
	);

	const separator = colWidths.map((w) => "-".repeat(w)).join(" | ");
	const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(" | ");
	const dataRows = rows
		.map((row) =>
			row.map((cell, i) => (cell || "").padEnd(colWidths[i])).join(" | "),
		)
		.join("\n");

	return `${headerRow}\n${separator}\n${dataRows}`;
}

export function parseArgs(args: string[]): {
	command: string;
	flags: Record<string, string>;
} {
	const command = args[0] || "";
	const flags: Record<string, string> = {};

	for (let i = 1; i < args.length; i++) {
		const arg = args[i];
		if (arg.startsWith("--")) {
			const key = arg.slice(2);
			const value = args[i + 1];
			if (value && !value.startsWith("--")) {
				flags[key] = value;
				i++;
			} else {
				flags[key] = "true";
			}
		}
	}

	return { command, flags };
}
