import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { KeyPair } from "near-api-js";
import { getNearAddressFromKeyPair } from "@/services/near-intents/wallet";
import type { KeyPairString } from "./types/near";

export interface Config {
	privateKey: KeyPairString;
	walletAddress: string;
}

export interface StoredConfig {
	apiKey?: string;
	privateKey?: string;
}

function getConfigDir(): string {
	return (
		process.env.NEAR_INTENTS_CONFIG_DIR ||
		path.join(os.homedir(), ".near-intents")
	);
}

function getConfigFile(): string {
	return path.join(getConfigDir(), "config.json");
}

/**
 * Read the stored config file from ~/.near-intents/config.json
 */
export function readStoredConfig(): StoredConfig {
	try {
		const configFile = getConfigFile();
		if (fs.existsSync(configFile)) {
			const content = fs.readFileSync(configFile, "utf-8");
			return JSON.parse(content) as StoredConfig;
		}
	} catch {
		// Ignore read errors, return empty config
	}
	return {};
}

/**
 * Write config to ~/.near-intents/config.json
 */
export function writeStoredConfig(config: StoredConfig): void {
	const configDir = getConfigDir();
	const configFile = getConfigFile();
	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true });
	}
	fs.writeFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Clear the stored config file
 */
export function clearStoredConfig(): void {
	const configFile = getConfigFile();
	if (fs.existsSync(configFile)) {
		fs.unlinkSync(configFile);
	}
}

/**
 * Get the path to the config file
 */
export function getConfigPath(): string {
	return getConfigFile();
}

/**
 * Get the API key from config file or environment variable.
 * Priority: config file > env var
 */
export function getApiKey(): string | undefined {
	const stored = readStoredConfig();
	return stored.apiKey ?? process.env.DEFUSE_JWT_TOKEN;
}

/**
 * Check if an API key is configured (either in config file or env var)
 */
export function hasApiKey(): boolean {
	return !!getApiKey();
}

/**
 * Load config with private key.
 * Priority for private key: config file > env var
 */
export function loadConfig(): Config {
	const stored = readStoredConfig();
	const privateKey = stored.privateKey ?? process.env.NEAR_PRIVATE_KEY;

	if (!privateKey) {
		throw new Error(
			"Private key required. Provide via:\n" +
				"  near-intents config generate-key\n" +
				"  near-intents config set private-key <key>\n" +
				"  NEAR_PRIVATE_KEY environment variable",
		);
	}

	const keyPair = KeyPair.fromString(privateKey as KeyPairString);
	const walletAddress = getNearAddressFromKeyPair(keyPair);

	return {
		privateKey: privateKey as KeyPairString,
		walletAddress,
	};
}

export function tryLoadConfig(): Config | null {
	try {
		return loadConfig();
	} catch {
		return null;
	}
}
