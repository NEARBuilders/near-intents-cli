import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tokensCommand } from "@/commands/tokens";

describe("tokens command", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it("should list all tokens", async () => {
		await tokensCommand({});

		expect(consoleSpy).toHaveBeenCalled();
		const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
		expect(output).toContain("Symbol");
		expect(output).toContain("Blockchain");
		expect(output).toContain("Total:");
	});

	it("should filter tokens with search flag", async () => {
		await tokensCommand({ search: "USDC" });

		expect(consoleSpy).toHaveBeenCalled();
		const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
		expect(output).toContain("USDC");
	});

	it("should handle no results gracefully", async () => {
		await tokensCommand({ search: "NONEXISTENT_TOKEN_XYZ_123" });

		expect(consoleSpy).toHaveBeenCalled();
		const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
		expect(output).toContain("No tokens found");
	});
});
