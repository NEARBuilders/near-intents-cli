# NEAR Intents CLI

SDK and CLI for NEAR Intents - cross-chain token swaps, deposits, and withdrawals. Execute intent-based token transfers across multiple blockchains including NEAR, Ethereum, Solana, and more.

## Features

- **Cross-Chain Swaps**: Swap tokens between any supported blockchains with intent-based execution
- **Deposits**: Generate deposit addresses to fund your wallet from external chains
- **Internal Transfers**: Instant, fee-free transfers between near-intents accounts
- **Withdrawals**: Withdraw tokens from your NEAR Intents wallet to external addresses
- **Balance Management**: View token balances across all supported chains
- **Token Discovery**: Search and browse all supported tokens with pricing information
- **SDK Access**: Programmatic JavaScript/TypeScript API for building applications
- **NEAR Wallet Integration**: Full support for NEAR account management and key pairs

## Supported Blockchains

- NEAR Protocol
- Ethereum
- Solana
- Stellar (with memo support)
- And more chains supported by the Defuse Protocol

## Installation

You can use the CLI directly without installing it, or install it globally.

### Quick Start (No Installation Required)

```bash
# Using pnpm dlx
pnpm dlx near-intents-cli tokens --search USDC

# Using bunx
bunx near-intents-cli tokens --search USDC

# Using npx
npx near-intents-cli tokens --search USDC
```

### Install Globally

```bash
# Using pnpm
pnpm add -g near-intents-cli

# Using npm
npm install -g near-intents-cli

# Using bun
bun add -g near-intents-cli
```

Then run commands directly:

```bash
near-intents-cli tokens --search USDC
near-intents-cli balances
```

## Quick Start

All examples below use `near-intents-cli` assuming you've installed the CLI globally. If you haven't installed it, prefix commands with your package runner:

```bash
# Using pnpm dlx
pnpm dlx near-intents-cli <command>

# Using bunx
bunx near-intents-cli <command>

# Using npx
npx near-intents-cli <command>
```

### 1. Generate a NEAR Key Pair

If you don't have a NEAR account, generate a new key pair:

```bash
near-intents-cli config generate-key
```

This creates a new ed25519 key pair and saves it to `~/.near-intents/config.json`. The wallet address will be displayed for you to fund.

### 2. Get an API Key (Optional)

For fee-free swaps, get a free API key from [near-intents.org/partners](https://partners.near-intents.org/):

```bash
near-intents-cli config set api-key YOUR_API_KEY
```

Without an API key, swaps incur a 0.1% fee.

### 3. Fund Your Wallet

Deposit tokens to start trading:

```bash
# Get a deposit address for USDC on Ethereum
near-intents-cli deposit --token USDC --blockchain eth
```

### 4. Start Trading

```bash
# Check your balances
near-intents-cli balances

# List available tokens
near-intents-cli tokens --search ETH

# Execute a swap
near-intents-cli swap --from USDC --to NEAR --amount 100

# Preview a swap without executing
near-intents-cli swap --from USDC --to NEAR --amount 100 --dry-run
```

## CLI Commands

### tokens

List and search supported tokens.

```bash
near-intents-cli tokens
near-intents-cli tokens --search USDC
near-intents-cli tokens --search ETH
```

Options:

- `--search <query>` - Filter tokens by search query (symbol, name, or token ID)

Output includes token symbol, blockchain, token ID, decimals, and USD price.

### balances

Show wallet balances across all supported tokens and blockchains.

```bash
near-intents-cli balances
```

Requires a configured private key. Displays wallet address and a table of all token balances.

### deposit

Get a deposit address to fund your wallet from external chains.

```bash
near-intents-cli deposit --token <symbol>
near-intents-cli deposit --token USDC --blockchain eth
```

Options:

- `--token <symbol>` - Token symbol (required)
- `--blockchain <chain>` - Blockchain name (required if token exists on multiple chains)

Output includes the deposit address, chain information, and minimum deposit amount.

### swap

Execute a cross-chain token swap.

```bash
near-intents-cli swap --from <symbol> --to <symbol> --amount <amount>
near-intents-cli swap --from USDC --to NEAR --amount 100
near-intents-cli swap --from ETH --to SOL --amount 1.5 --from-chain eth --to-chain sol
```

Options:

- `--from <symbol>` - Source token symbol (required)
- `--from-chain <chain>` - Source blockchain (optional, inferred if unambiguous)
- `--to <symbol>` - Destination token symbol (required)
- `--to-chain <chain>` - Destination blockchain (optional, inferred if unambiguous)
- `--amount <num>` - Amount to swap (required)
- `--dry-run` - Show quote without executing the swap

### transfer

Transfer tokens to another near-intents account. Internal transfers are instant and fee-free.

```bash
near-intents-cli transfer --to <address> --amount <amount> --token <symbol>
near-intents-cli transfer --to 0x1234567890abcdef --amount 50 --token USDC
```

Options:

- `--to <address>` - Destination near-intents address (required)
- `--amount <num>` - Amount to transfer (required)
- `--token <symbol>` - Token symbol (required)
- `--blockchain <chain>` - Blockchain (if token exists on multiple chains)
- `--dry-run` - Show quote without executing the transfer

### withdraw

Withdraw tokens from your NEAR Intents wallet to an external address.

```bash
near-intents-cli withdraw --to <address> --amount <amount> --token <symbol>
near-intents-cli withdraw --to 0x1234567890abcdef --amount 50 --token USDC --blockchain eth
```

Options:

- `--to <address>` - Destination address (required)
- `--amount <num>` - Amount to withdraw (required)
- `--token <symbol>` - Token symbol (required)
- `--blockchain <chain>` - Blockchain (required if token exists on multiple chains)
- `--dry-run` - Show quote without executing the withdrawal

### config

Manage CLI configuration settings.

```bash
# Show current configuration
near-intents-cli config get

# Set API key
near-intents-cli config set api-key YOUR_API_KEY

# Set private key
near-intents-cli config set private-key ed25519:YOUR_PRIVATE_KEY

# Generate a new NEAR key pair
near-intents-cli config generate-key

# Clear all configuration
near-intents-cli config clear
```

The config file is stored at `~/.near-intents/config.json`.

## SDK Usage

Import the SDK into your JavaScript/TypeScript projects:

```typescript
import {
  getSupportedTokens,
  getTokenBalances,
  getSwapQuote,
  executeSwapQuote,
  getTransferQuote,
  executeTransfer,
  getWithdrawQuote,
  executeWithdrawQuote,
  getDepositAddress,
  loadConfig,
  configureOneClickAPI,
} from "near-intents-cli";
```

### Configuration

```typescript
import { loadConfig } from "near-intents-cli";

// Load configuration with private key
const config = loadConfig();
// { privateKey: "ed25519:...", walletAddress: "..." }

// Configure the OneClick API with custom settings
configureOneClickAPI({
  baseUrl: "https://1click.chaindefuser.com",
  token: "your-api-key",
});
```

### Token Operations

```typescript
import { getSupportedTokens, searchTokens, getToken } from "near-intents-cli";

// Get all supported tokens
const tokens = await getSupportedTokens();
// [{ symbol: "NEAR", blockchain: "near", decimals: 24, ... }, ...]

// Search for tokens
const results = await searchTokens("USDC");
// [{ symbol: "USDC", blockchain: "eth", ... }, ...]

// Get a specific token
const token = await getToken("USDC");
// { symbol: "USDC", blockchain: "eth", decimals: 6, ... }
```

### Balance Operations

```typescript
import { getTokenBalances, loadConfig } from "near-intents-cli";

const config = loadConfig();
const balances = await getTokenBalances({
  walletAddress: config.walletAddress,
});
// [{ symbol: "NEAR", blockchain: "near", balance: "1000000000000000000000000", ... }, ...]
```

### Swap Operations

```typescript
import { getSwapQuote, executeSwapQuote, loadConfig } from "near-intents-cli";

const config = loadConfig();

// Get a swap quote
const quoteResult = await getSwapQuote({
  walletAddress: config.walletAddress,
  fromTokenId: "eth:usdc",
  toTokenId: "near:near",
  amount: "100",
});

if (quoteResult.status === "success") {
  console.log(`Rate: 1 USDC = ${quoteResult.exchangeRate} NEAR`);

  // Execute the swap
  const result = await executeSwapQuote({
    privateKey: config.privateKey,
    walletAddress: config.walletAddress,
    quote: quoteResult.quote,
  });

  console.log(`Transaction: ${result.txHash}`);
  console.log(`Explorer: ${result.explorerLink}`);
}
```

### Withdraw Operations

```typescript
import {
  getWithdrawQuote,
  executeWithdrawQuote,
  loadConfig,
} from "near-intents-cli";

const config = loadConfig();

// Get a withdrawal quote
const quoteResult = await getWithdrawQuote({
  walletAddress: config.walletAddress,
  destinationAddress: "0x1234567890abcdef",
  assetId: "near:near",
  amount: "50",
  decimals: 24,
});

if (quoteResult.status === "success") {
  console.log(`Fee: ${quoteResult.transferFeeFormatted} NEAR`);
  console.log(`You receive: ${quoteResult.receivedAmountFormatted} NEAR`);

  // Execute the withdrawal
  const result = await executeWithdrawQuote({
    privateKey: config.privateKey,
    walletAddress: config.walletAddress,
    quote: quoteResult.quote,
  });

  console.log(`Transaction: ${result.txHash}`);
}
```

### Transfer Operations

```typescript
import {
  getTransferQuote,
  executeTransfer,
  loadConfig,
} from "near-intents-cli";

const config = loadConfig();

// Get a transfer quote (validates balance)
const quoteResult = await getTransferQuote({
  walletAddress: config.walletAddress,
  tokenId: "nep141:usdc.near",
  amount: "50",
  decimals: 6,
  toAddress: "0x1234567890abcdef",
});

if (quoteResult.status === "success") {
  console.log(`Amount: ${quoteResult.amountFormatted}`);

  // Execute the transfer
  const result = await executeTransfer({
    privateKey: config.privateKey,
    tokenId: "nep141:usdc.near",
    amount: quoteResult.amount,
    toAddress: "0x1234567890abcdef",
  });

  console.log(`Transaction: ${result.txHash}`);
  console.log(`Explorer: ${result.explorerLink}`);
}
```

### Deposit Operations

```typescript
import { getDepositAddress, loadConfig } from "near-intents-cli";

const config = loadConfig();

// Get a deposit address
const result = await getDepositAddress({
  authIdentifier: config.walletAddress,
  authMethod: "near",
  assetId: "eth:usdc",
});

console.log(`Deposit Address: ${result.address}`);
console.log(`Chain: ${result.chain}`);
```

## Configuration

### Config File

The CLI stores configuration in `~/.near-intents/config.json`:

```json
{
  "apiKey": "your-api-key",
  "privateKey": "ed25519:your-private-key"
}
```

### Environment Variables

You can also use environment variables:

| Variable           | Description                           |
| ------------------ | ------------------------------------- |
| `NEAR_PRIVATE_KEY` | NEAR private key (ed25519:xxx format) |
| `DEFUSE_JWT_TOKEN` | API key for fee-free swaps            |

### Priority

Config priority: CLI config file > environment variables

## API Key

An API key is optional but recommended:

- **Without API key**: 0.1% fee on all swaps and withdrawals
- **With API key**: Fee-free swaps (get a free key at [partners.near-intents.org](https://partners.near-intents.org/))

The API key is stored securely in your config file.

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Run in watch mode
pnpm dev

# Run CLI directly
pnpm cli tokens --search ETH

# Build for production
pnpm build

# Run tests
pnpm test
```

### Project Structure

```
near-intents-cli/
├── src/
│   ├── cli.ts              # CLI entry point and command routing
│   ├── index.ts            # SDK exports
│   ├── config.ts           # Configuration management
│   ├── commands/           # CLI command implementations
│   │   ├── tokens.ts
│   │   ├── balances.ts
│   │   ├── deposit.ts
│   │   ├── swap.ts
│   │   ├── withdraw.ts
│   │   └── config.ts
│   ├── services/           # Core business logic
│   │   ├── tokens/         # Token listing and search
│   │   ├── balance/        # Balance queries
│   │   ├── swap/           # Swap quotes and execution
│   │   ├── transfer/       # Internal transfer between accounts
│   │   ├── withdraw/       # Withdrawal quotes and execution
│   │   ├── deposit/        # Deposit address generation
│   │   ├── near-intents/   # NEAR SDK integration
│   │   └── oneclick/       # OneClick API integration
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Dependencies

Key dependencies used by this project:

- **@defuse-protocol/intents-sdk**: Core intents protocol SDK
- **@defuse-protocol/one-click-sdk-typescript**: One-click swap API
- **@defuse-protocol/internal-utils**: Internal utilities
- **near-api-js**: NEAR blockchain interaction
- **viem**: Ethereum interaction and formatting
- **borsh/borsher**: Binary serialization
- **zod**: Schema validation