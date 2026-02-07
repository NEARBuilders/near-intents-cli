import { describe, expect, it } from "vitest";
import { resolveCliMode } from "@/cli-mode";

describe("resolveCliMode", () => {
	it("returns human for --human", () => {
		expect(resolveCliMode({ human: "true" }, "agent")).toBe("human");
	});

	it("returns agent for --agent", () => {
		expect(resolveCliMode({ agent: "true" }, "human")).toBe("agent");
	});

	it("returns saved preferred mode when flags are absent", () => {
		expect(resolveCliMode({}, "human")).toBe("human");
		expect(resolveCliMode({}, "agent")).toBe("agent");
	});

	it("defaults to agent when no flags and no saved mode", () => {
		expect(resolveCliMode({})).toBe("agent");
	});

	it("throws when --human and --agent are both provided", () => {
		expect(() => resolveCliMode({ human: "true", agent: "true" })).toThrow(
			"--human and --agent cannot be used together",
		);
	});
});
