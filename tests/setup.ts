import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterAll, beforeAll } from "vitest";

// Create temp config directory for test isolation
const TEST_CONFIG_DIR = path.join(
  os.tmpdir(),
  `near-intents-test-${process.pid}`
);

beforeAll(() => {
  process.env.NEAR_INTENTS_CONFIG_DIR = TEST_CONFIG_DIR;
  if (!fs.existsSync(TEST_CONFIG_DIR)) {
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
  }
});

afterAll(() => {
  // Clean up temp config directory
  if (fs.existsSync(TEST_CONFIG_DIR)) {
    fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
  }
});

// Export test helpers
export const TEST_CONFIG_DIR_PATH = TEST_CONFIG_DIR;

export function hasPrivateKey(): boolean {
  return !!process.env.NEAR_PRIVATE_KEY;
}

export function getTestPrivateKey() {
  return process.env.NEAR_PRIVATE_KEY as `ed25519:${string}` | undefined;
}

export function cleanupConfigDir(): void {
  const configFile = path.join(TEST_CONFIG_DIR, "config.json");
  if (fs.existsSync(configFile)) {
    fs.unlinkSync(configFile);
  }
}
