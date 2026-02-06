import type { QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { oc } from "every-plugin/orpc";
import { z } from "zod";
import { balanceResponseSchema } from "../services/balance/schema";
import { depositAddressResponseSchema } from "../services/deposit/schema";
import {
	swapExecuteResponseSchema,
	swapQuoteResponseSchema,
} from "../services/swap/schema";
import { tokenSchema } from "../services/tokens/schema";
import {
	transferQuoteResponseSchema,
	transferSubmitResponseSchema,
} from "../services/transfer/schema";
import {
	withdrawQuoteResponseSchema,
	withdrawSubmitResponseSchema,
} from "../services/withdraw/schema";

const quoteSchema = z.custom<QuoteResponse>(
	(data): data is QuoteResponse => true,
);

export const contract = oc.router({
	tokensList: oc
		.route({ method: "GET", path: "/tokens" })
		.input(z.object({ search: z.string().optional() }))
		.output(z.object({ tokens: z.array(tokenSchema) })),

	tokensSearch: oc
		.route({ method: "GET", path: "/tokens/search" })
		.input(z.object({ query: z.string().min(1), limit: z.number().optional() }))
		.output(z.object({ tokens: z.array(tokenSchema) })),

	balancesGet: oc
		.route({ method: "GET", path: "/balances" })
		.input(z.object({ walletAddress: z.string() }))
		.output(balanceResponseSchema),

	depositAddress: oc
		.route({ method: "GET", path: "/deposit/address" })
		.input(z.object({ assetId: z.string() }))
		.output(depositAddressResponseSchema),

	swapQuote: oc
		.route({ method: "POST", path: "/swap/quote" })
		.input(
			z.object({
				walletAddress: z.string(),
				fromTokenId: z.string(),
				toTokenId: z.string(),
				amount: z.string(),
			}),
		)
		.output(swapQuoteResponseSchema),

	swapExecute: oc
		.route({ method: "POST", path: "/swap/execute" })
		.input(
			z.object({
				walletAddress: z.string(),
				quote: quoteSchema,
			}),
		)
		.output(swapExecuteResponseSchema),

	transferQuote: oc
		.route({ method: "POST", path: "/transfer/quote" })
		.input(
			z.object({
				walletAddress: z.string(),
				tokenId: z.string(),
				amount: z.string(),
				decimals: z.number(),
				toAddress: z.string(),
			}),
		)
		.output(transferQuoteResponseSchema),

	transferExecute: oc
		.route({ method: "POST", path: "/transfer/execute" })
		.input(
			z.object({
				tokenId: z.string(),
				amount: z.string(),
				toAddress: z.string(),
			}),
		)
		.output(transferSubmitResponseSchema),

	withdrawQuote: oc
		.route({ method: "POST", path: "/withdraw/quote" })
		.input(
			z.object({
				walletAddress: z.string(),
				destinationAddress: z.string(),
				assetId: z.string(),
				amount: z.string(),
				decimals: z.number(),
			}),
		)
		.output(withdrawQuoteResponseSchema),

	withdrawExecute: oc
		.route({ method: "POST", path: "/withdraw/execute" })
		.input(
			z.object({
				walletAddress: z.string(),
				quote: quoteSchema,
			}),
		)
		.output(withdrawSubmitResponseSchema),
});
