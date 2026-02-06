import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		cli: "src/cli.ts",
		server: "src/server/index.ts",
	},
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	shims: true,
	noExternal: [/^@defuse-protocol\//, /^near-api-js/],
});
