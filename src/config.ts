import { getNearAddressFromKeyPair } from "@/services/near-intents/wallet";
import { KeyPair } from "near-api-js";
import { KeyPairString } from "./types/near";

export interface Config {
  privateKey: KeyPairString;
  walletAddress: string;
}

export function loadConfig(): Config {
  const privateKey = process.env.NEAR_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("NEAR_PRIVATE_KEY environment variable is required");
  }

  const keyPair = KeyPair.fromString(privateKey as KeyPairString);
  const walletAddress = getNearAddressFromKeyPair(keyPair);

  return {
    privateKey: privateKey as KeyPairString,
    walletAddress,
  };
}

export function tryLoadConfig(): Config | null {
  try {
    return loadConfig();
  } catch {
    return null;
  }
}
