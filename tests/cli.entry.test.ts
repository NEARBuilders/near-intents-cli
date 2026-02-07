import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getPreferredMode: vi.fn(),
	setPreferredMode: vi.fn(),
	loadConfig: vi.fn(),
	runHumanSession: vi.fn(),
	balancesCommand: vi.fn(),
	tokensCommand: vi.fn(),
	depositCommand: vi.fn(),
	swapCommand: vi.fn(),
	transferCommand: vi.fn(),
	withdrawCommand: vi.fn(),
	configCommand: vi.fn(),
}));

vi.mock("@/config", () => ({
	getPreferredMode: mocks.getPreferredMode,
	setPreferredMode: mocks.setPreferredMode,
	loadConfig: mocks.loadConfig,
}));

vi.mock("@/human/session", () => ({
	runHumanSession: mocks.runHumanSession,
}));

vi.mock("@/commands/balances", () => ({
	balancesCommand: mocks.balancesCommand,
}));

vi.mock("@/commands/tokens", () => ({
	tokensCommand: mocks.tokensCommand,
}));

vi.mock("@/commands/deposit", () => ({
	depositCommand: mocks.depositCommand,
}));

vi.mock("@/commands/swap", () => ({
	swapCommand: mocks.swapCommand,
}));

vi.mock("@/commands/transfer", () => ({
	transferCommand: mocks.transferCommand,
}));

vi.mock("@/commands/withdraw", () => ({
	withdrawCommand: mocks.withdrawCommand,
}));

vi.mock("@/commands/config", () => ({
	configCommand: mocks.configCommand,
}));

vi.mock("@/utils/terminal-ui", () => ({
	buildCliHelp: () => "MOCK_HELP",
}));

describe("cli entry behavior", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getPreferredMode.mockReturnValue(undefined);
		mocks.loadConfig.mockReturnValue({
			privateKey: "ed25519:test",
			walletAddress: "alice.near",
		});
	});

	it("--human saves preference and launches human session", async () => {
		const { runCli } = await import("@/cli");

		await runCli(["--human"]);

		expect(mocks.setPreferredMode).toHaveBeenCalledWith("human");
		expect(mocks.runHumanSession).toHaveBeenCalledTimes(1);
	});

	it("--agent saves preference and stays one-shot", async () => {
		const { runCli } = await import("@/cli");

		await runCli(["--agent", "balances"]);

		expect(mocks.setPreferredMode).toHaveBeenCalledWith("agent");
		expect(mocks.balancesCommand).toHaveBeenCalledWith({
			privateKey: "ed25519:test",
			walletAddress: "alice.near",
		});
		expect(mocks.runHumanSession).not.toHaveBeenCalled();
	});

	it("no command launches human session when preferred mode is human", async () => {
		const { runCli } = await import("@/cli");
		mocks.getPreferredMode.mockReturnValue("human");

		await runCli([]);

		expect(mocks.runHumanSession).toHaveBeenCalledTimes(1);
	});

	it("no command shows help when preferred mode is agent", async () => {
		const { runCli } = await import("@/cli");
		mocks.getPreferredMode.mockReturnValue("agent");
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		await runCli([]);

		expect(logSpy).toHaveBeenCalledWith("MOCK_HELP");
		logSpy.mockRestore();
	});

	it("no command defaults to agent behavior when preference is unset", async () => {
		const { runCli } = await import("@/cli");
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		await runCli([]);

		expect(logSpy).toHaveBeenCalledWith("MOCK_HELP");
		logSpy.mockRestore();
	});

	it("saved human mode still runs one-shot for explicit command", async () => {
		const { runCli } = await import("@/cli");
		mocks.getPreferredMode.mockReturnValue("human");

		await runCli(["balances"]);

		expect(mocks.balancesCommand).toHaveBeenCalledTimes(1);
		expect(mocks.runHumanSession).not.toHaveBeenCalled();
	});

	it("keeps invariant: --human with command throws", async () => {
		const { runCli } = await import("@/cli");

		await expect(runCli(["--human", "balances"]))
			.rejects.toThrow("--human mode does not accept direct command arguments");
	});
});
