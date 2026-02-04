import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { balancesCommand } from "@/commands/balances";
import { getSandboxCredentials } from "../setup";

describe("balances command", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	function getConfig() {
		return getSandboxCredentials();
	}

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it("should display wallet address", async () => {
		const config = getConfig();
		await balancesCommand(config);

		const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
		expect(output).toContain("Wallet:");
		expect(output).toContain(config.walletAddress);
	});

	it("should display balance table or no balances message", async () => {
		const config = getConfig();
		await balancesCommand(config);

		const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
		// Should either have a table with headers or "No balances found"
		expect(
			output.includes("Symbol") || output.includes("No balances found"),
		).toBe(true);
	});
});
