import { JsonRpcProvider } from "@near-js/providers";

export const getNearProvider = () => {
  return new JsonRpcProvider({
    url: "https://rpc.mainnet.fastnear.com",
  });
};
