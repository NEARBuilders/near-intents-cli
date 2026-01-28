import { getNearAddressFromKeyPair } from "@/services/near-intents/wallet";
import { KeyPair } from "near-api-js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { KeyPairString } from "./types/near";

export interface Config {
  privateKey: KeyPairString;
  walletAddress: string;
}

export interface StoredConfig {
  apiKey?: string;
  privateKey?: string;
}

const CONFIG_DIR =
  process.env.NEAR_INTENTS_CONFIG_DIR || path.join(os.homedir(), ".near-intents");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

/**
 * Read the stored config file from ~/.near-intents/config.json
 */
export function readStoredConfig(): StoredConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, "utf-8");
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
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Clear the stored config file
 */
export function clearStoredConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}

/**
 * Get the path to the config file
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
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
        "  NEAR_PRIVATE_KEY environment variable"
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
