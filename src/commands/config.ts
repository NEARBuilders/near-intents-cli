import { KeyPair, KeyPairString } from "near-api-js";
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
    case "generate-key":
      return configGenerateKey();
    default:
      console.log(`Usage: near-intents config <command>

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
      "Error: Missing key. Usage: config set <api-key|private-key> <value>"
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
    default:
      console.error(`Unknown config key: ${key}`);
      console.error("Valid keys: api-key, private-key");
      process.exit(1);
  }
}

function configGet() {
  const config = readStoredConfig();
  const configPath = getConfigPath();

  if (!config.apiKey && !config.privateKey) {
    console.log(`No config found at ${configPath}`);
    console.log("\nTo get started:");
    console.log("  near-intents config generate-key");
    console.log("  near-intents config set api-key <key>");
    return;
  }

  console.log(`Config file: ${configPath}\n`);

  if (config.apiKey) {
    const masked = config.apiKey.slice(0, 8) + "..." + config.apiKey.slice(-4);
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
}

function configClear() {
  clearStoredConfig();
  console.log(`Config cleared: ${getConfigPath()}`);
}

function configGenerateKey() {
  const config = readStoredConfig();

  if (config.privateKey) {
    console.error("Error: Private key already exists in config.");
    console.error("Run 'near-intents config clear' first to remove it.");
    process.exit(1);
  }

  const keyPair = KeyPair.fromRandom("ed25519");
  const privateKey = keyPair.toString();
  const address = getNearAddressFromKeyPair(keyPair);

  config.privateKey = privateKey;
  writeStoredConfig(config);

  console.log(`New key pair generated and saved to ${getConfigPath()}\n`);
  console.log(`Wallet address: ${address}`);
  console.log(`\nTo fund this wallet, deposit tokens using:`);
  console.log(`  near-intents deposit --token USDC --blockchain eth`);
}
