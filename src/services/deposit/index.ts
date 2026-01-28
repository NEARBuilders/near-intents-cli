import {
  AuthMethod,
  authIdentity,
  poaBridge,
} from "@defuse-protocol/internal-utils";
import { DepositAddressResponse } from "./schema";

interface DepositAddressResult {
  generatedDepositAddress: string;
  memo: string | null;
}

export async function getDepositAddress({
  authIdentifier,
  authMethod,
  assetId,
}: {
  authIdentifier: string;
  authMethod: AuthMethod;
  assetId: string;
}): Promise<DepositAddressResponse> {
  let depositAddress: DepositAddressResult;
  try {
    const accountId = authIdentity.authHandleToIntentsUserId(
      authIdentifier,
      authMethod
    );

    const [blockchain, type] = assetId.split(":");
    const chain = `${blockchain}:${type}`;

    const quoteResponse = await poaBridge.httpClient.getDepositAddress({
      account_id: accountId,
      chain,
      deposit_mode: blockchain.includes("stellar") ? "MEMO" : "SIMPLE",
    });

    if (!quoteResponse.address) {
      throw new Error("Deposit address not found");
    }

    depositAddress = {
      generatedDepositAddress: quoteResponse.address,
      memo: quoteResponse.memo ?? null,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get deposit address");
  }

  return {
    address: depositAddress.generatedDepositAddress,
    chain: assetId,
  };
}
