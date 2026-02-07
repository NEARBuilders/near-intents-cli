import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configCommand } from "@/commands/config";
import { readStoredConfig } from "@/config";

const TEST_CONFIG_DIR = path.join(
	os.tmpdir(),
	`near-intents-config-command-test-${process.pid}`,
);

function cleanupConfigDir(): void {
	const configFile = path.join(TEST_CONFIG_DIR, "config.json");
	if (fs.existsSync(configFile)) {
		fs.unlinkSync(configFile);
	}
}

describe("config command", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
	let exitSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		process.env.NEAR_INTENTS_CONFIG_DIR = TEST_CONFIG_DIR;
		if (!fs.existsSync(TEST_CONFIG_DIR)) {
			fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
		}
		cleanupConfigDir();
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		exitSpy.mockRestore();
		cleanupConfigDir();
	});

	describe("generate-wallet", () => {
		it("should generate a new key pair", async () => {
			await configCommand({ _subcommand: "generate-wallet" });

			const config = readStoredConfig();
			expect(config.privateKey).toBeDefined();
			expect(config.privateKey).toMatch(/^ed25519:/);

			const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
			expect(output).toContain("Wallet address:");
		});

		it("keeps generate-wallet as backward-compatible alias", async () => {
			await configCommand({ _subcommand: "generate-wallet" });
			const config = readStoredConfig();
			expect(config.privateKey).toMatch(/^ed25519:/);
		});

		it("should error if key already exists", async () => {
			await configCommand({ _subcommand: "generate-wallet" });
			consoleSpy.mockClear();
			consoleErrorSpy.mockClear();

			await expect(
				configCommand({ _subcommand: "generate-wallet" }),
			).rejects.toThrow("process.exit called");

			const errorOutput = consoleErrorSpy.mock.calls
				.map((c) => c[0])
				.join("\n");
			expect(errorOutput).toContain("already exists");
		});
	});

	describe("set", () => {
		it("should set api-key", async () => {
			await configCommand({
				_subcommand: "set",
				_key: "api-key",
				_value: "test-api-key-123",
			});

			const config = readStoredConfig();
			expect(config.apiKey).toBe("test-api-key-123");
		});

		it("should set private-key", async () => {
			const testKey =
				"ed25519:5WqR9HzH6vQfqVMxTf9bJTqNb5xPYK7qPzQvF5fS1B3v5WqR9HzH6vQfqVMxTf9bJTqNb5xPYK7qPzQvF5fS1B3v";
			await configCommand({
				_subcommand: "set",
				_key: "private-key",
				_value: testKey,
			});

			const config = readStoredConfig();
			expect(config.privateKey).toBe(testKey);
		});

		it("should set preferred-mode", async () => {
			await configCommand({
				_subcommand: "set",
				_key: "preferred-mode",
				_value: "human",
			});

			const config = readStoredConfig();
			expect(config.preferredMode).toBe("human");
		});

		it("should error on missing key", async () => {
			await expect(
				configCommand({ _subcommand: "set", _key: "", _value: "val" }),
			).rejects.toThrow("process.exit called");
		});

		it("should error on missing value", async () => {
			await expect(
				configCommand({
					_subcommand: "set",
					_key: "api-key",
					_value: "",
				}),
			).rejects.toThrow("process.exit called");
		});

		it("should error on unknown key", async () => {
			await expect(
				configCommand({
					_subcommand: "set",
					_key: "unknown-key",
					_value: "val",
				}),
			).rejects.toThrow("process.exit called");
		});

		it("should error on invalid preferred-mode value", async () => {
			await expect(
				configCommand({
					_subcommand: "set",
					_key: "preferred-mode",
					_value: "invalid-mode",
				}),
			).rejects.toThrow("process.exit called");
		});
	});

	describe("get", () => {
		it("should show no config message when empty", async () => {
			await configCommand({ _subcommand: "get" });

			const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
			expect(output).toContain("No config found");
		});

		it("should show config when set", async () => {
			await configCommand({
				_subcommand: "set",
				_key: "api-key",
				_value: "test-api-key-12345678",
			});
			consoleSpy.mockClear();

			await configCommand({ _subcommand: "get" });

			const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
			expect(output).toContain("API key:");
			expect(output).toContain("test-api");
			expect(output).toContain("Preferred mode: (not set)");
		});

		it("should show preferred mode when set", async () => {
			await configCommand({
				_subcommand: "set",
				_key: "preferred-mode",
				_value: "agent",
			});
			consoleSpy.mockClear();

			await configCommand({ _subcommand: "get" });

			const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
			expect(output).toContain("Preferred mode: agent");
		});
	});

	describe("clear", () => {
		it("should clear config", async () => {
			await configCommand({
				_subcommand: "set",
				_key: "api-key",
				_value: "test-key",
			});
			await configCommand({
				_subcommand: "set",
				_key: "preferred-mode",
				_value: "human",
			});

			await configCommand({ _subcommand: "clear" });

			const config = readStoredConfig();
			expect(config.apiKey).toBeUndefined();
			expect(config.privateKey).toBeUndefined();
			expect(config.preferredMode).toBeUndefined();
		});
	});

	describe("default (help)", () => {
		it("should show usage when no subcommand", async () => {
			await configCommand({});

			const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
			expect(output).toContain("Usage:");
			expect(output).toContain("generate-wallet");
			expect(output).toContain("preferred-mode");
		});
	});
});
