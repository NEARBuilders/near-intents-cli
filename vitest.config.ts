import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ["tests/**/*.test.ts"],
		environment: "node",
		reporters: ["verbose"],
		testTimeout: 30000,
		setupFiles: ["./tests/setup.ts"],
		server: {
			deps: {
				inline: ["@defuse-protocol/intents-sdk", "near-api-js"],
			},
		},
	},
});
