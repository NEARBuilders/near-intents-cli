// NEAR Intents SDK
// Public API exports for programmatic use

// Re-export useful types from dependencies
export { AuthMethod } from "@defuse-protocol/internal-utils";
export type { QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
export type { Config, StoredConfig } from "./config";
// ============================================================================
// Configuration
// ============================================================================
export {
	clearStoredConfig,
	getApiKey,
	getConfigPath,
	hasApiKey,
	loadConfig,
	readStoredConfig,
	tryLoadConfig,
	writeStoredConfig,
} from "./config";
// ============================================================================
// Balances
// ============================================================================
export { getTokenBalances } from "./services/balance/balances";
export type { BalanceResponse, TokenBalance } from "./services/balance/schema";
// ============================================================================
// Deposit
// ============================================================================
export type {
	DepositAddressRequest,
	DepositAddressResponse,
} from "./services/deposit/schema";
export { getDepositAddress } from "./services/deposit/service";
// ============================================================================
// NEAR Utilities
// ============================================================================
export { getNearIntentsSDK } from "./services/near-intents/sdk";
export {
	getNearAddressFromKeyPair,
	getNearSignerFromKeyPair,
	getNearWalletFromKeyPair,
} from "./services/near-intents/wallet";
// ============================================================================
// OneClick API Configuration
// ============================================================================
export { configureOneClickAPI } from "./services/oneclick/index";
export type {
	SwapExecuteRequest,
	SwapExecuteResponse,
	SwapQuoteErrorInternal,
	SwapQuoteRequest,
	SwapQuoteResponse,
	SwapQuoteResultInternal,
	SwapQuoteSuccessInternal,
} from "./services/swap/schema";
// ============================================================================
// Swap
// ============================================================================
export { executeSwapQuote, getSwapQuote } from "./services/swap/service";
// ============================================================================
// Types
// ============================================================================
export type {
	SearchQuery,
	Token,
	TokenResponse,
	TokensListResponse,
} from "./services/tokens/schema";
// ============================================================================
// Tokens
// ============================================================================
export {
	getSupportedTokens,
	getToken,
	getTokenById,
	getTokensByBlockchain,
	searchTokens,
	searchTokensBySymbol,
} from "./services/tokens/service";
export type {
	TransferQuoteResponse,
	TransferRequest,
	TransferSubmitResponse,
} from "./services/transfer/schema";
// ============================================================================
// Transfer
// ============================================================================
export {
	executeTransfer,
	getTransferQuote,
	transferToken,
} from "./services/transfer/service";
export type {
	WithdrawQuoteErrorInternal,
	WithdrawQuoteRequest,
	WithdrawQuoteResponse,
	WithdrawQuoteResultInternal,
	WithdrawQuoteSuccessInternal,
	WithdrawSubmitRequest,
	WithdrawSubmitResponse,
} from "./services/withdraw/schema";
// ============================================================================
// Withdraw
// ============================================================================
export {
	executeWithdrawQuote,
	getWithdrawQuote,
} from "./services/withdraw/service";
export type { KeyPairString } from "./types/near";
