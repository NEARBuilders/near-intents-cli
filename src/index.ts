// NEAR Intents SDK
// Public API exports for programmatic use

// ============================================================================
// Tokens
// ============================================================================
export {
  getSupportedTokens,
  getToken,
  getTokenById,
  searchTokens,
  searchTokensBySymbol,
  getTokensByBlockchain,
} from "./services/tokens/service";

// ============================================================================
// Balances
// ============================================================================
export { getTokenBalances } from "./services/balance/balances";

// ============================================================================
// Swap
// ============================================================================
export { getSwapQuote, executeSwapQuote } from "./services/swap/service";

// ============================================================================
// Withdraw
// ============================================================================
export {
  getWithdrawQuote,
  executeWithdrawQuote,
} from "./services/withdraw/service";

// ============================================================================
// Deposit
// ============================================================================
export { getDepositAddress } from "./services/deposit/index";

// ============================================================================
// NEAR Utilities
// ============================================================================
export { getNearIntentsSDK } from "./services/near-intents/sdk";
export {
  getNearWalletFromKeyPair,
  getNearAddressFromKeyPair,
  getNearSignerFromKeyPair,
} from "./services/near-intents/wallet";

// ============================================================================
// OneClick API Configuration
// ============================================================================
export { configureOneClickAPI } from "./services/oneclick/index";

// ============================================================================
// Configuration
// ============================================================================
export {
  loadConfig,
  tryLoadConfig,
  readStoredConfig,
  writeStoredConfig,
  clearStoredConfig,
  getConfigPath,
  getApiKey,
  hasApiKey,
} from "./config";
export type { Config, StoredConfig } from "./config";

// ============================================================================
// Types
// ============================================================================
export type {
  Token,
  SearchQuery,
  TokensListResponse,
  TokenResponse,
} from "./services/tokens/schema";

export type {
  TokenBalance,
  BalanceResponse,
} from "./services/balance/schema";

export type {
  SwapQuoteRequest,
  SwapQuoteResponse,
  SwapExecuteRequest,
  SwapExecuteResponse,
  SwapQuoteResultInternal,
  SwapQuoteSuccessInternal,
  SwapQuoteErrorInternal,
} from "./services/swap/schema";

export type {
  WithdrawQuoteRequest,
  WithdrawQuoteResponse,
  WithdrawSubmitRequest,
  WithdrawSubmitResponse,
  WithdrawQuoteResultInternal,
  WithdrawQuoteSuccessInternal,
  WithdrawQuoteErrorInternal,
} from "./services/withdraw/schema";

export type {
  DepositAddressRequest,
  DepositAddressResponse,
} from "./services/deposit/schema";

export type { KeyPairString } from "./types/near";

// Re-export useful types from dependencies
export { AuthMethod } from "@defuse-protocol/internal-utils";
export type { QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
