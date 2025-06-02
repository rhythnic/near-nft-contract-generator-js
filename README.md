# NEAR NFT Contract Generator

This package allows you to generate a fully-featured NFT smart contract for the NEAR blockchain. The generator supports multiple NFT standards (NEPs) and allows you to customize your contract.

## Features

- Supports multiple NEP standards:
    - NEP-171: Core NFT Standard (required)
    - NEP-177: NFT Metadata
    - NEP-178: NFT Approval Management
    - NEP-181: NFT Enumeration
    - NEP-199: NFT Royalty
- Built-in minting functionality
- Comprehensive JSDoc documentation
- TypeScript implementation

## Warning

This library is currently in alpha and is not yet ready for production use. Use at your own risk.
Thoroughly audit your generated contracts before deploying them to the NEAR blockchain.

## Quickstart

1. Make sure you have installed [node.js](https://nodejs.org/en/download/package-manager/) >= 16.
2. Clone this repository and install dependencies:

```bash
git clone https://github.com/your-username/nft-example.git
cd nft-example
yarn install
```

## Generating an NFT Contract

The repository comes with a pre-generated contract at `src/contract.ts`. You can use this contract as-is, or generate a new one with different features.

To generate a new contract, use the `generate` command with the desired NEP standards:

```bash
# Basic usage - generates a contract with NEP-171 (Core) only
yarn generate <output-path>

# Include additional standards
yarn generate <output-path> --nep177 --nep178 --nep181 --nep199
```

**Notes:**

- The generator will fail if the output file already exists to prevent accidental overwrites.
- The file `contract-example.ts` was generated using all NEP standards.

### Examples

```bash
# Generate a contract with metadata support
yarn generate src/my-nft-contract.ts --nep177

# Generate a full-featured NFT contract with all standards
yarn generate src/full-nft.ts --nep177 --nep178 --nep181 --nep199

# Customize the contract name and symbol
yarn generate src/custom-nft.ts --nep177 --name "My Awesome NFTs" --symbol "AWESOME"
```

## Building and Deploying

After generating your contract, you can build and deploy it to the NEAR blockchain. You must first generate a contract with `yarn generate`.

```bash
npm run build
```

<br />

## 2. Create an Account and Deploy the Contract

You can create a new account and deploy the contract by running:

```bash
near create-account <your-account.testnet> --useFaucet
near deploy <your-account.testnet> build/release/nft_contract.wasm
```
