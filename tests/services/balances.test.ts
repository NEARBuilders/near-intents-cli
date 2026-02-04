import { describe, expect, it } from "vitest";
import { getTokenBalances } from "@/services/balance/balances";
import { getSandboxCredentials } from "../setup";

describe("balances service", () => {
	function getWalletAddress(): string {
		return getSandboxCredentials().walletAddress;
	}

	describe("getTokenBalances", () => {
		it("should return balances array", async () => {
			const walletAddress = getWalletAddress();
			const balances = await getTokenBalances({ walletAddress });

			expect(Array.isArray(balances)).toBe(true);
		});

		it("should return balances with required fields", async () => {
			const walletAddress = getWalletAddress();
			const balances = await getTokenBalances({ walletAddress });

			if (balances.length > 0) {
				const balance = balances[0];
				expect(balance).toHaveProperty("symbol");
				expect(balance).toHaveProperty("blockchain");
				expect(balance).toHaveProperty("balance");
				expect(balance).toHaveProperty("balanceFormatted");
				expect(balance).toHaveProperty("intentsTokenId");
			}
		});

		it("should only return non-zero balances", async () => {
			const walletAddress = getWalletAddress();
			const balances = await getTokenBalances({ walletAddress });

			for (const balance of balances) {
				expect(balance.balance).not.toBe("0");
			}
		});
	});
});
