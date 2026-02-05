import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "zod";
import { contract } from "./contract";
import { createNearIntentsService } from "./service";

interface PluginContext {
	service: ReturnType<typeof createNearIntentsService>;
}

export default createPlugin({
	contract,

	variables: z.object({
		recipient: z.string().default("near-intents.near").optional(),
	}),

	secrets: z.object({
		privateKey: z.string().optional(),
	}),

	initialize: ({ secrets }) =>
		Effect.sync(() => ({
			service: createNearIntentsService(secrets.privateKey),
		})),

	shutdown: () => Effect.void,

	createRouter: (context: PluginContext, builder) => ({
		tokensList: builder.tokensList.handler(async ({ input }) => {
			return await context.service.tokensList(input.search);
		}),

		tokensSearch: builder.tokensSearch.handler(async ({ input }) => {
			return await context.service.tokensSearch(input.query, input.limit);
		}),

		balancesGet: builder.balancesGet.handler(async ({ input }) => {
			return await context.service.balancesGet(input.walletAddress);
		}),

		depositAddress: builder.depositAddress.handler(async ({ input }) => {
			return await context.service.depositAddress(input.assetId);
		}),

		swapQuote: builder.swapQuote.handler(async ({ input }) => {
			return await context.service.swapQuote(input);
		}),

		swapExecute: builder.swapExecute.handler(async ({ input }) => {
			return await context.service.swapExecute({
				walletAddress: input.walletAddress,
				quote: input.quote,
			});
		}),

		transferQuote: builder.transferQuote.handler(async ({ input }) => {
			return await context.service.transferQuote(input);
		}),

		transferExecute: builder.transferExecute.handler(async ({ input }) => {
			return await context.service.transferExecute({
				tokenId: input.tokenId,
				amount: input.amount,
				toAddress: input.toAddress,
			});
		}),

		withdrawQuote: builder.withdrawQuote.handler(async ({ input }) => {
			return await context.service.withdrawQuote(input);
		}),

		withdrawExecute: builder.withdrawExecute.handler(async ({ input }) => {
			return await context.service.withdrawExecute({
				walletAddress: input.walletAddress,
				quote: input.quote,
			});
		}),
	}),
});
