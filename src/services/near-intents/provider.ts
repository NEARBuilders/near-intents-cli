import { JsonRpcProvider } from "near-api-js";

export const getNearProvider = () => {
  return new JsonRpcProvider({
    url: "https://rpc.mainnet.fastnear.com",
  });
};
