import type { PreferredMode } from "./config";

export type CliMode = "human" | "agent";

export function resolveCliMode(
	flags: Record<string, string>,
	preferredMode?: PreferredMode,
): CliMode {
	const human = flags.human === "true";
	const agent = flags.agent === "true";

	if (human && agent) {
		throw new Error("--human and --agent cannot be used together");
	}

	if (human) {
		return "human";
	}

	if (agent) {
		return "agent";
	}

	if (preferredMode) {
		return preferredMode;
	}

	return "agent";
}
