# Facthound

**Facthound is a truth-seeking missile.** 

**Facthound is information bounties and information markets.**

**Facthound is the only forum that matters.**

## Overview

Facthound is an information bounty system where users ask questions and post optional bounties held in the Facthound escrow smart contract. Bounty posters pay out rewards to users who provide their preferred answers. While platforms like Quora and Reddit may refuse certain types of questions, Facthound's incentive-based model ensures virtually any question can be answered for the right price.

## Key Features

- **Information Bounties**: Post questions with ETH rewards for quality answers
- **Blockchain Integration**: Secure escrow system using smart contracts
- **Dual Authentication**: Traditional username/password or Ethereum wallet (SIWE) authentication
- **Answer Selection**: Question askers can select the best answer to receive the bounty
- **On-chain Verification**: Confirm questions, answers, and selections on the blockchain

## How It Works

1. **Ask a Question**: Users post questions with optional ETH bounties held in escrow
2. **Submit Answers**: Other users provide answers to earn the bounty
3. **Select Answer**: The question asker selects their preferred answer
4. **Payout**: The bounty is automatically released to the selected answerer

## This Repo

This repository contains Facthound's frontend, written for Next.js.
It is live at [facthound.xyz](https://facthound.xyz)


## Setup and Installation

### Requirements

- Node.js v16+ and npm

### Clone

```bash
git clone https://github.com/matthew-ritch/facthound-frontend
cd facthound-frontend
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file with the following variables:
```
BACKEND_URL=your_backend_url
ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BASE_MAINNET_FACTHOUND=0x6F639b39606936F8Dfb82322781c913170b66f4f
NEXT_PUBLIC_WALLETCONNECT_KEY=your_walletconnect_key
```

### Run Dev Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run start
```

## Technologies Used

- **Frontend**: Next.js, React, TypeScript
- **Authentication**: SIWE (Sign-In With Ethereum)
- **Blockchain Integration**: viem, wagmi, Alchemy SDK
- **Smart Contract**: Solidity

## Smart Contract Interaction

The frontend connects to the Facthound escrow smart contract deployed on Base Mainnet. The contract address is:

```
0x6F639b39606936F8Dfb82322781c913170b66f4f
```

You can view the contract on [Basescan](https://basescan.org/address/0x6F639b39606936F8Dfb82322781c913170b66f4f).
