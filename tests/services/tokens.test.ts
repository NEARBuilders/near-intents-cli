import { describe, expect, it } from "vitest";
import {
	getSupportedTokens,
	getToken,
	getTokensByBlockchain,
	searchTokens,
} from "@/services/tokens";

describe("tokens service", () => {
	describe("getSupportedTokens", () => {
		it("should return a list of tokens", async () => {
			const tokens = await getSupportedTokens();
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBeGreaterThan(0);
		});

		it("should return tokens with required fields", async () => {
			const tokens = await getSupportedTokens();
			const token = tokens[0];

			expect(token).toHaveProperty("symbol");
			expect(token).toHaveProperty("blockchain");
			expect(token).toHaveProperty("intentsTokenId");
			expect(token).toHaveProperty("decimals");
			expect(token).toHaveProperty("priceUSD");
		});
	});

	describe("searchTokens", () => {
		it("should return all tokens with empty query", async () => {
			const tokens = await searchTokens("");
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.length).toBeGreaterThan(0);
		});

		it("should filter tokens by search query", async () => {
			const tokens = await searchTokens("USDC");
			expect(tokens.length).toBeGreaterThan(0);
			expect(tokens.some((t) => t.symbol.includes("USDC"))).toBe(true);
		});

		it("should respect limit option", async () => {
			const tokens = await searchTokens("", { limit: 5 });
			expect(tokens.length).toBeLessThanOrEqual(5);
		});
	});

	describe("getTokensByBlockchain", () => {
		it("should return tokens for a specific blockchain", async () => {
			const tokens = await getTokensByBlockchain("near");
			expect(Array.isArray(tokens)).toBe(true);
			expect(tokens.every((t) => t.blockchain === "near")).toBe(true);
		});

		it("should be case insensitive", async () => {
			const tokens = await getTokensByBlockchain("NEAR");
			expect(tokens.length).toBeGreaterThan(0);
		});
	});

	describe("getToken", () => {
		it("should return token by symbol", async () => {
			const token = await getToken("USDC");
			expect(token).not.toBeNull();
			expect(token?.symbol).toBe("USDC");
		});

		it("should return null for non-existent token", async () => {
			const token = await getToken("NONEXISTENT_TOKEN_XYZ");
			expect(token).toBeNull();
		});

		it("should be case insensitive for symbol", async () => {
			const token = await getToken("usdc");
			expect(token).not.toBeNull();
			expect(token?.symbol).toBe("USDC");
		});
	});
});
