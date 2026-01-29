import z from "zod";
import { nearClient, queryContract } from "./utils";

export async function batchBalanceOf({
	accountId,
	tokenIds,
}: {
	accountId: string;
	tokenIds: string[];
}): Promise<bigint[]> {
	const data = await queryContract({
		contractId: "intents.near",
		nearClient: nearClient,
		methodName: "mt_batch_balance_of",
		args: {
			account_id: accountId,
			token_ids: tokenIds,
		},
	});

	return z
		.array(z.string())
		.transform((arr) => arr.map(BigInt))
		.parse(data);
}
