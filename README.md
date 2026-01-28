# NEAR Intents CLI

A command-line interface for NEAR Intents, enabling seamless cross-chain token operations including swaps, deposits, and withdrawals. Built on the Defuse Protocol, this CLI provides direct access to decentralized intent-based trading across multiple blockchain networks.

## Overview

NEAR Intents CLI empowers users to interact with the NEAR ecosystem through a simple command-line interface. The tool abstracts the complexity of cross-chain transactions, allowing you to:

- Browse and search available tokens across supported blockchains
- Check your token balances across multiple chains
- Generate deposit addresses for depositing tokens
- Execute atomic swaps between different tokens and blockchains
- Withdraw tokens to external addresses on various networks

The CLI uses intent-based execution, which means you specify your desired outcome (e.g., "swap 100 USDC for NEAR"), and the system finds the best path to fulfill that intent automatically.

## Installation

Clone the repository and install dependencies using your preferred package manager:

```bash
git clone https://github.com/your-org/near-intents-cli.git
cd near-intents-cli
pnpm install
```

## Building

Build the CLI for production use:

```bash
pnpm build
```

The compiled output will be available at `dist/index.cjs`.

## Running

You can run the CLI in several ways:

```bash
# Development mode with auto-reload
pnpm dev

# Run directly with tsx
pnpm cli <command>

# Production mode (after building)
pnpm start
```

## Configuration

The CLI requires your NEAR private key to sign transactions. Set it as an environment variable:

```bash
export NEAR_PRIVATE_KEY="ed25519:your_private_key_here"
```

For persistent configuration, add this to your shell profile or create a `.env` file:

```bash
cp .env.example .env.local
# Edit .env.local and add your NEAR_PRIVATE_KEY
```

## Commands

### tokens

List all supported tokens or search for specific ones. This command displays token details including symbol, blockchain, token ID, decimals, and current USD price.

```bash
# List all supported tokens
pnpm cli tokens

# Search for specific tokens
pnpm cli tokens --search USDC
pnpm cli tokens --search NEAR
```

Options:

- `--search <query>` - Filter tokens by name or symbol

### balances

Display your token balances across all supported blockchains. This command shows your wallet address and a formatted table of all token holdings.

```bash
pnpm cli balances
```

Sample output:

```
Wallet: your-account.near

Symbol     Blockchain    Balance
--------   -----------   -----------
NEAR       near          150.00
USDC       eth           500.00
USDT       eth           250.00
WBTC       btc           0.50
```

### deposit

Generate a deposit address for a specific token. Use this to deposit tokens from external wallets or exchanges into the NEAR Intents system.

```bash
# Deposit USDC on Ethereum
pnpm cli deposit --token USDC --blockchain eth

# Deposit NEAR (blockchain not required for NEAR native token)
pnpm cli deposit --token NEAR
```

Options:

- `--token <symbol>` - Token symbol (required)
- `--blockchain <chain>` - Blockchain name (required if token exists on multiple chains)

The command outputs the deposit address and minimum deposit amount for the specified token.

### swap

Execute a token swap between different tokens or blockchains. The CLI fetches a quote, displays the exchange rate, and then executes the swap upon confirmation.

```bash
# Swap USDC on Ethereum for NEAR
pnpm cli swap --from USDC --from-chain eth --to NEAR --amount 100

# Preview quote without executing (dry run)
pnpm cli swap --from USDC --to NEAR --amount 100 --dry-run

# Swap between two different tokens on the same blockchain
pnpm cli swap --from ETH --to USDC --amount 1 --blockchain eth
```

Options:

- `--from <symbol>` - Source token symbol (required)
- `--from-chain <chain>` - Source blockchain (optional)
- `--to <symbol>` - Destination token symbol (required)
- `--to-chain <chain>` - Destination blockchain (optional)
- `--amount <num>` - Amount to swap (required)
- `--dry-run` - Show quote without executing the swap

The swap command displays:

- Amount in with source token details
- Amount out with destination token details
- Exchange rate between the tokens

### withdraw

Withdraw tokens from the NEAR Intents system to an external blockchain address. This command retrieves a quote showing fees and the final amount you will receive.

```bash
# Withdraw USDC to an Ethereum address
pnpm cli withdraw --to 0x742d35Cc6634C0532925a3b844Bc9e7595f8fE45 --amount 50 --token USDC --blockchain eth

# Preview withdrawal without executing
pnpm cli withdraw --to 0x742d35Cc6634C0532925a3b844Bc9e7595f8fE45 --amount 50 --token USDC --blockchain eth --dry-run
```

Options:

- `--to <address>` - Destination blockchain address (required)
- `--amount <num>` - Amount to withdraw (required)
- `--token <symbol>` - Token symbol (required)
- `--blockchain <chain>` - Blockchain name (required if token exists on multiple chains)
- `--dry-run` - Show quote without executing the withdrawal

The withdrawal quote includes:

- Amount being withdrawn
- Transfer fee
- Final amount you will receive at the destination

## Supported Blockchains

The CLI supports multiple blockchains for cross-chain operations. Common blockchain identifiers include:

- `near` - NEAR Protocol
- `eth` - Ethereum
- `polygon` - Polygon
- `bsc` - Binance Smart Chain
- `arbitrum` - Arbitrum
- `optimism` - Optimism
- `avax` - Avalanche
- `solana` - Solana
- `btc` - Bitcoin

## Environment Variables

| Variable           | Description                                     | Required |
| ------------------ | ----------------------------------------------- | -------- |
| `NEAR_PRIVATE_KEY` | Your NEAR account private key in ed25519 format | Yes      |
| `NODE_ENV`         | Environment mode (development/production)       | No       |

## Troubleshooting

### Private Key Format

Ensure your NEAR private key is in the correct ed25519 format:

```
ed25519:ABC123... (base58 encoded)
```

Never share your private key. Keep it secure and never commit it to version control.

### Insufficient Balance

If you receive a balance error, verify:

1. Your wallet has sufficient funds for the transaction
2. You have enough NEAR for gas fees (if transacting on NEAR)
3. The token exists on the specified blockchain

### Quote Errors

If quotes fail to load:

1. Check your internet connection
2. Verify the token pair is supported
3. Ensure amounts are within reasonable bounds

## Development

Run tests:

```bash
pnpm test
```

Watch mode for development:

```bash
pnpm dev
```

## Dependencies

The CLI relies on several key libraries:

- `@defuse-protocol/intents-sdk` - Core intents protocol implementation
- `@near-js/*` - NEAR blockchain interaction
- `near-api-js` - NEAR API client
- `viem` - Ethereum interaction library
- `zod` - Schema validation
