import { KeyPair } from "near-api-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { depositCommand } from "@/commands/deposit";
import { getNearAddressFromKeyPair } from "@/services/near-intents/wallet";
import type { KeyPairString } from "@/types/near";
import { getTestPrivateKey, hasPrivateKey } from "../setup";

describe.skipIf(!hasPrivateKey())("deposit command", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	function getConfig() {
		const privateKey = getTestPrivateKey();
		const keyPair = KeyPair.fromString(privateKey);
		const walletAddress = getNearAddressFromKeyPair(keyPair);
		return { privateKey: privateKey as KeyPairString, walletAddress };
	}

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it("should require --token flag", async () => {
		const config = getConfig();

		await expect(depositCommand(config, {})).rejects.toThrow(
			"--token is required",
		);
	});

	it("should display deposit address for USDC on eth", async () => {
		const config = getConfig();
		await depositCommand(config, { token: "USDC", blockchain: "eth" });

		const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
		expect(output).toContain("Deposit Address:");
		expect(output).toMatch(/0x[a-fA-F0-9]{40}/);
	});

	it("should display token info and min deposit", async () => {
		const config = getConfig();
		await depositCommand(config, { token: "USDC", blockchain: "base" });

		const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
		expect(output).toContain("Token: USDC");
		expect(output).toContain("Min deposit:");
	});

	it("should error on ambiguous token without blockchain", async () => {
		const config = getConfig();

		// USDC exists on multiple chains, so without --blockchain it should error
		await expect(depositCommand(config, { token: "USDC" })).rejects.toThrow(
			"Multiple tokens found",
		);
	});
});
