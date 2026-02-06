import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Near } from "near-kit";
import { Sandbox } from "near-kit/sandbox";
import { afterAll, beforeAll } from "vitest";

const TEST_CONFIG_DIR = path.join(
	os.tmpdir(),
	`near-intents-test-${process.pid}`,
);

let sandbox: Sandbox;
let _near: Near;

beforeAll(async () => {
	sandbox = await Sandbox.start();
	_near = new Near({ network: sandbox });

	process.env.NEAR_INTENTS_CONFIG_DIR = TEST_CONFIG_DIR;
	if (!fs.existsSync(TEST_CONFIG_DIR)) {
		fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
	}
}, 30000);

afterAll(async () => {
	if (sandbox) {
		await sandbox.stop();
	}

	if (fs.existsSync(TEST_CONFIG_DIR)) {
		fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
	}
});

export const TEST_CONFIG_DIR_PATH = TEST_CONFIG_DIR;

export function getSandboxCredentials() {
	if (!sandbox) {
		throw new Error("Sandbox not initialized");
	}
	return {
		privateKey: sandbox.rootAccount.secretKey as `ed25519:${string}`,
		walletAddress: sandbox.rootAccount.id,
	};
}

export function cleanupConfigDir(): void {
	const configFile = path.join(TEST_CONFIG_DIR, "config.json");
	if (fs.existsSync(configFile)) {
		fs.unlinkSync(configFile);
	}
}
