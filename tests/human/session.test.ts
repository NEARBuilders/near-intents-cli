import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	select: vi.fn(),
	input: vi.fn(),
	confirm: vi.fn(),
	swapCommand: vi.fn(),
	transferCommand: vi.fn(),
	withdrawCommand: vi.fn(),
	depositCommand: vi.fn(),
	balancesCommand: vi.fn(),
	tokensCommand: vi.fn(),
	configCommand: vi.fn(),
	loadConfig: vi.fn(),
	tryLoadConfig: vi.fn(),
	getApiKey: vi.fn(),
	getPreferredMode: vi.fn(),
	consoleLog: vi.spyOn(console, "log").mockImplementation(() => {}),
	consoleError: vi.spyOn(console, "error").mockImplementation(() => {}),
}));

vi.mock("@inquirer/prompts", () => ({
	select: mocks.select,
	input: mocks.input,
	confirm: mocks.confirm,
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
vi.mock("@/commands/deposit", () => ({
	depositCommand: mocks.depositCommand,
}));
vi.mock("@/commands/balances", () => ({
	balancesCommand: mocks.balancesCommand,
}));
vi.mock("@/commands/tokens", () => ({
	tokensCommand: mocks.tokensCommand,
}));
vi.mock("@/commands/config", () => ({
	configCommand: mocks.configCommand,
}));
vi.mock("@/config", () => ({
	loadConfig: mocks.loadConfig,
	tryLoadConfig: mocks.tryLoadConfig,
	getApiKey: mocks.getApiKey,
	getPreferredMode: mocks.getPreferredMode,
}));

describe("human session", () => {
	const originalInTTY = process.stdin.isTTY;
	const originalOutTTY = process.stdout.isTTY;
	const escapedPromptError = () => {
		const error = new Error("force closed");
		error.name = "ExitPromptError";
		return error;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mocks.loadConfig.mockReturnValue({
			privateKey: "ed25519:test",
			walletAddress: "alice.near",
		});
		mocks.tryLoadConfig.mockReturnValue({
			privateKey: "ed25519:test",
			walletAddress: "alice.near",
		});
		mocks.getApiKey.mockReturnValue("api-key");
		mocks.getPreferredMode.mockReturnValue("human");
		Object.defineProperty(process.stdin, "isTTY", {
			value: true,
			configurable: true,
		});
		Object.defineProperty(process.stdout, "isTTY", {
			value: true,
			configurable: true,
		});
	});

	afterEach(() => {
		Object.defineProperty(process.stdin, "isTTY", {
			value: originalInTTY,
			configurable: true,
		});
		Object.defineProperty(process.stdout, "isTTY", {
			value: originalOutTTY,
			configurable: true,
		});
		mocks.consoleLog.mockClear();
		mocks.consoleError.mockClear();
	});

	it("rejects in non-TTY terminals", async () => {
		const { runHumanSession } = await import("@/human/session");
		Object.defineProperty(process.stdin, "isTTY", {
			value: false,
			configurable: true,
		});

		await expect(runHumanSession()).rejects.toThrow(
			"--human requires a TTY terminal",
		);
	});

	it("runs swap action and returns to menu", async () => {
		const { runHumanSession } = await import("@/human/session");
		mocks.select.mockResolvedValueOnce("swap").mockResolvedValueOnce("exit");

		await runHumanSession();

		expect(mocks.swapCommand).toHaveBeenCalledWith(
			{ privateKey: "ed25519:test", walletAddress: "alice.near" },
			{ interactive: "true" },
		);
		expect(mocks.select).toHaveBeenCalledTimes(2);
	});

	it("runs balances action and returns to menu", async () => {
		const { runHumanSession } = await import("@/human/session");
		mocks.select
			.mockResolvedValueOnce("balances")
			.mockResolvedValueOnce("exit");

		await runHumanSession();

		expect(mocks.balancesCommand).toHaveBeenCalledWith({
			privateKey: "ed25519:test",
			walletAddress: "alice.near",
		});
	});

	it("routes config submenu actions", async () => {
		const { runHumanSession } = await import("@/human/session");
		mocks.select
			.mockResolvedValueOnce("config")
			.mockResolvedValueOnce("set-api-key")
			.mockResolvedValueOnce("back")
			.mockResolvedValueOnce("exit");
		mocks.input.mockResolvedValueOnce("new-api-key");

		await runHumanSession();

		expect(mocks.configCommand).toHaveBeenCalledWith({
			_subcommand: "set",
			_key: "api-key",
			_value: "new-api-key",
		});
	});

	it("continues loop when action throws", async () => {
		const { runHumanSession } = await import("@/human/session");
		mocks.swapCommand.mockRejectedValueOnce(new Error("boom"));
		mocks.select.mockResolvedValueOnce("swap").mockResolvedValueOnce("exit");

		await runHumanSession();

		expect(mocks.consoleError).toHaveBeenCalled();
		expect(mocks.select).toHaveBeenCalledTimes(2);
	});

	it("exits cleanly on exit action", async () => {
		const { runHumanSession } = await import("@/human/session");
		mocks.select.mockResolvedValueOnce("exit");

		await runHumanSession();

		expect(mocks.select).toHaveBeenCalledTimes(1);
	});

	it("uses single Esc as back in submenu", async () => {
		const { runHumanSession } = await import("@/human/session");
		mocks.select
			.mockResolvedValueOnce("config")
			.mockRejectedValueOnce(escapedPromptError())
			.mockResolvedValueOnce("exit");

		await runHumanSession();

		expect(mocks.select).toHaveBeenCalledTimes(3);
		expect(mocks.configCommand).not.toHaveBeenCalled();
	});

	it("exits on quick double Esc", async () => {
		const { runHumanSession } = await import("@/human/session");
		mocks.select
			.mockRejectedValueOnce(escapedPromptError())
			.mockRejectedValueOnce(escapedPromptError());

		await runHumanSession();

		expect(mocks.select).toHaveBeenCalledTimes(2);
	});

	it("ignores duplicate session starts while one is already running", async () => {
		const { runHumanSession } = await import("@/human/session");
		let resolveSelect: ((value: "exit") => void) | undefined;
		const firstSelect = new Promise<"exit">((resolve) => {
			resolveSelect = resolve;
		});
		mocks.select.mockReturnValueOnce(firstSelect);

		const firstRun = runHumanSession();
		const secondRun = runHumanSession();
		resolveSelect?.("exit");

		await Promise.all([firstRun, secondRun]);

		expect(mocks.select).toHaveBeenCalledTimes(1);
	});
});
