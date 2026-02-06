import { KeyPair } from "near-api-js";
import type { KeyPairString } from "@/types/near";
import {
	clearStoredConfig,
	getConfigPath,
	readStoredConfig,
	writeStoredConfig,
} from "../config";
import { getNearAddressFromKeyPair } from "../services/near-intents/wallet";
import { styles } from "../utils/styles";

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
		case "generate-key":
			return configGenerateKey();
		default:
			console.log(`Usage: near-intents-cli config <command>

Commands:
  set api-key <key>      Save API key to config file
  set private-key <key>  Save private key to config file
  generate-key           Generate new NEAR key pair
  get                    Show current config
  clear                  Remove config file

Config file: ${getConfigPath()}`);
	}
}

function configSet(key: string | undefined, value: string | undefined) {
	if (!key) {
		console.error(
			styles.error(
				"Missing key. Usage: config set <api-key|private-key> <value>",
			),
		);
		process.exit(1);
	}
	if (!value) {
		console.error(
			styles.error(`Missing value. Usage: config set ${key} <value>`),
		);
		process.exit(1);
	}

	const config = readStoredConfig();

	switch (key) {
		case "api-key":
			config.apiKey = value;
			writeStoredConfig(config);
			console.log(styles.success(`API key saved to ${getConfigPath()}`));
			break;
		case "private-key":
			config.privateKey = value;
			writeStoredConfig(config);
			console.log(styles.success(`Private key saved to ${getConfigPath()}`));
			break;
		default:
			console.error(styles.error(`Unknown config key: ${key}`));
			console.error(styles.dim("Valid keys: api-key, private-key"));
			process.exit(1);
	}
}

function configGet() {
	const config = readStoredConfig();
	const configPath = getConfigPath();

	if (!config.apiKey && !config.privateKey) {
		console.log(styles.warning(`No config found at ${configPath}`));
		console.log("\nTo get started:");
		console.log(styles.cyan("  near-intents-cli config generate-key"));
		console.log(styles.cyan("  near-intents-cli config set api-key <key>"));
		return;
	}

	console.log(`${styles.dim(`Config file: ${configPath}`)}\n`);

	if (config.apiKey) {
		const masked = `${config.apiKey.slice(0, 8)}...${config.apiKey.slice(-4)}`;
		console.log(styles.keyValuePair("API key", masked));
	} else {
		console.log(styles.keyValuePair("API key", styles.dim("(not set)")));
	}

	if (config.privateKey) {
		const prefix = config.privateKey.split(":")[0];
		const keyPair = KeyPair.fromString(config.privateKey as KeyPairString);
		const address = getNearAddressFromKeyPair(keyPair);
		console.log(styles.keyValuePair("Private key", `${prefix}:****`));
		console.log(styles.keyValuePair("Wallet address", address));
	} else {
		console.log(styles.keyValuePair("Private key", styles.dim("(not set)")));
	}
}

function configClear() {
	clearStoredConfig();
	console.log(styles.success(`Config cleared: ${getConfigPath()}`));
}

function configGenerateKey() {
	const config = readStoredConfig();

	if (config.privateKey) {
		console.error(styles.error("Private key already exists in config."));
		console.error(
			styles.dim("Run 'near-intents-cli config clear' first to remove it."),
		);
		process.exit(1);
	}

	const keyPair = KeyPair.fromRandom("ed25519");
	const privateKey = keyPair.toString();
	const address = getNearAddressFromKeyPair(keyPair);

	config.privateKey = privateKey;
	writeStoredConfig(config);

	console.log(
		styles.success(`New key pair generated and saved to ${getConfigPath()}`),
	);
	console.log(styles.keyValuePair("Wallet address", address));
	console.log(`\n${styles.dim("To fund this wallet, deposit tokens using:")}`);
	console.log(
		styles.cyan("  near-intents-cli deposit --token USDC --blockchain eth"),
	);
}
