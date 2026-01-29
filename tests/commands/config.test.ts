import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configCommand } from "@/commands/config";
import { readStoredConfig } from "@/config";
import { cleanupConfigDir } from "../setup";

describe("config command", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
	let exitSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
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

	describe("generate-key", () => {
		it("should generate a new key pair", async () => {
			await configCommand({ _subcommand: "generate-key" });

			const config = readStoredConfig();
			expect(config.privateKey).toBeDefined();
			expect(config.privateKey).toMatch(/^ed25519:/);

			const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
			expect(output).toContain("Wallet address:");
		});

		it("should error if key already exists", async () => {
			// First generate (cleanupConfigDir runs in beforeEach, so we need to generate fresh)
			await configCommand({ _subcommand: "generate-key" });
			consoleSpy.mockClear();
			consoleErrorSpy.mockClear();

			// Second generate should fail
			await expect(
				configCommand({ _subcommand: "generate-key" }),
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
	});

	describe("get", () => {
		it("should show no config message when empty", async () => {
			await configCommand({ _subcommand: "get" });

			const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
			expect(output).toContain("No config found");
		});

		it("should show config when set", async () => {
			// Set up some config
			await configCommand({
				_subcommand: "set",
				_key: "api-key",
				_value: "test-api-key-12345678",
			});
			consoleSpy.mockClear();

			await configCommand({ _subcommand: "get" });

			const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
			expect(output).toContain("API key:");
			expect(output).toContain("test-api"); // masked
		});
	});

	describe("clear", () => {
		it("should clear config", async () => {
			// Set up some config
			await configCommand({
				_subcommand: "set",
				_key: "api-key",
				_value: "test-key",
			});

			// Clear it
			await configCommand({ _subcommand: "clear" });

			const config = readStoredConfig();
			expect(config.apiKey).toBeUndefined();
			expect(config.privateKey).toBeUndefined();
		});
	});

	describe("default (help)", () => {
		it("should show usage when no subcommand", async () => {
			await configCommand({});

			const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
			expect(output).toContain("Usage:");
			expect(output).toContain("generate-key");
		});
	});
});
