import { KeyPairString } from "@/types/near";
import {
  IntentsSDK,
  createIntentSignerNearKeyPair,
} from "@defuse-protocol/intents-sdk";
import { KeyPair } from "near-api-js";
import { getNearWalletFromKeyPair } from "./wallet";

export const getNearIntentsSDK = async ({
  privateKey,
}: {
  privateKey: KeyPairString;
}) => {
  const keyPair = KeyPair.fromString(privateKey);
  const account = getNearWalletFromKeyPair(keyPair);

  return new IntentsSDK({
    env: "production",
    referral: "near-dca",
    intentSigner: createIntentSignerNearKeyPair({
      signer: keyPair,
      accountId: account.accountId,
    }),
  });
};
