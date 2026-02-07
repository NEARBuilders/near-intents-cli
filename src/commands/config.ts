import { KeyPair } from "near-api-js";
import type { KeyPairString } from "@/types/near";
import {
	clearStoredConfig,
	getConfigPath,
	readStoredConfig,
	writeStoredConfig,
} from "../config";
import { getNearAddressFromKeyPair } from "../services/near-intents/wallet";

export async function configCommand(flags: Record<string, string>) {
	const subcommand = flags._subcommand;
	const key = flags._key;
	const value = flags._value;

	switch (subcommand) {
		case "set":
			return configSet(key, value);
		case "get":
			return configGet();
		case "clear":
			return configClear();
		case "generate-wallet":
			return configGenerateKey();
		default:
			console.log(`Usage: near-intents-cli config <command>

Commands:
  set api-key <key>            Save API key to config file
  set private-key <key>        Save private key to config file
  set preferred-mode <mode>    Save startup mode (human|agent)
  generate-wallet              Generate new NEAR wallet
  get                          Show current config
  clear                        Remove config file

Config file: ${getConfigPath()}`);
	}
}

function configSet(key: string | undefined, value: string | undefined) {
	if (!key) {
		console.error(
			"Error: Missing key. Usage: config set <api-key|private-key|preferred-mode> <value>",
		);
		process.exit(1);
	}
	if (!value) {
		console.error(`Error: Missing value. Usage: config set ${key} <value>`);
		process.exit(1);
	}

	const config = readStoredConfig();

	switch (key) {
		case "api-key":
			config.apiKey = value;
			writeStoredConfig(config);
			console.log(`API key saved to ${getConfigPath()}`);
			break;
		case "private-key":
			config.privateKey = value;
			writeStoredConfig(config);
			console.log(`Private key saved to ${getConfigPath()}`);
			break;
		case "preferred-mode":
			if (value !== "human" && value !== "agent") {
				console.error(`Invalid preferred mode: ${value}`);
				console.error("Valid values: human, agent");
				process.exit(1);
			}
			config.preferredMode = value;
			writeStoredConfig(config);
			console.log(`Preferred mode saved to ${getConfigPath()}`);
			break;
		default:
			console.error(`Unknown config key: ${key}`);
			console.error("Valid keys: api-key, private-key, preferred-mode");
			process.exit(1);
	}
}

function configGet() {
	const config = readStoredConfig();
	const configPath = getConfigPath();

	if (!config.apiKey && !config.privateKey && !config.preferredMode) {
		console.log(`No config found at ${configPath}`);
		console.log("\nTo get started:");
		console.log("  near-intents-cli config generate-wallet");
		console.log("  near-intents-cli config set api-key <key>");
		console.log("  near-intents-cli config set preferred-mode <human|agent>");
		return;
	}

	console.log(`Config file: ${configPath}\n`);

	if (config.apiKey) {
		const masked = `${config.apiKey.slice(0, 8)}...${config.apiKey.slice(-4)}`;
		console.log(`API key: ${masked}`);
	} else {
		console.log("API key: (not set)");
	}

	if (config.privateKey) {
		const prefix = config.privateKey.split(":")[0];
		const keyPair = KeyPair.fromString(config.privateKey as KeyPairString);
		const address = getNearAddressFromKeyPair(keyPair);
		console.log(`Private key: ${prefix}:****`);
		console.log(`Wallet address: ${address}`);
	} else {
		console.log("Private key: (not set)");
	}

	console.log(`Preferred mode: ${config.preferredMode ?? "(not set)"}`);
}

function configClear() {
	clearStoredConfig();
	console.log(`Config cleared: ${getConfigPath()}`);
}

function configGenerateKey() {
	const config = readStoredConfig();

	if (config.privateKey) {
		console.error("Error: Private key already exists in config.");
		console.error("Run 'near-intents-cli config clear' first to remove it.");
		process.exit(1);
	}

	const keyPair = KeyPair.fromRandom("ed25519");
	const privateKey = keyPair.toString();
	const address = getNearAddressFromKeyPair(keyPair);

	config.privateKey = privateKey;
	writeStoredConfig(config);

	console.log(`New key pair generated and saved to ${getConfigPath()}\n`);
	console.log(`Wallet address: ${address}`);
	console.log("\nTo fund this wallet, deposit tokens using:");
	console.log("  near-intents-cli deposit --token USDC --blockchain eth");
}
