# 🗳️ Sui Voting DApp

A decentralized voting application built on the Sui blockchain that allows users to create proposals, cast votes, and view results in real-time.

![Sui Voting DApp](https://img.shields.io/badge/Sui-Testnet-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Frontend Setup](#frontend-setup)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## ✨ Features

- **Create Proposals**: Users can create voting proposals with a question and 3 options
- **Cast Votes**: One vote per user per proposal with on-chain verification
- **Real-time Results**: Live vote counts and percentages with winner highlighting
- **Search & Filter**: Search proposals by title with pagination support
- **Wallet Integration**: Seamless Sui wallet connection
- **Event-Based Architecture**: Efficient data fetching using Sui events
- **Modern UI**: Responsive Tailwind CSS design with smooth animations
- **Vote Receipts**: NFT receipts minted for each vote cast

## 🛠️ Tech Stack

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- @mysten/dapp-kit
- @mysten/sui

**Blockchain:**
- Sui Move
- Sui Testnet

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Sui CLI](https://docs.sui.io/build/install) (for smart contract deployment)
- [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet) browser extension

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sui-voting-dapp.git
cd sui-voting-dapp
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install
```

## 📝 Smart Contract Deployment

### 1. Switch to Sui Testnet

```bash
sui client switch --env testnet
```

If you don't have testnet configured:

```bash
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client switch --env testnet
```

### 2. Get Testnet Tokens

Get free testnet SUI tokens from the faucet:

**Web Faucet:** https://faucet.sui.io/

Paste your wallet address and request tokens.

### 3. Build the Smart Contract

```bash
cd voting_dapp
sui move build
```

### 4. Deploy to Testnet

```bash
sui client publish --gas-budget 100000000
```

**Important:** Save the **Package ID** from the output!

Example output:
```
Published Objects:
┌──
│ PackageID: 0xfddb89b5c3187546e3... ← COPY THIS!
│ Version: 1
└──
```

### 5. Verify on Sui Explorer

Visit: https://suiscan.xyz/testnet

Search for your Package ID to verify the deployment.

## ⚙️ Frontend Setup

### 1. Configure Network Settings

Edit `frontend/src/networkConfig.ts`:

```typescript
import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId: "0xYOUR_PACKAGE_ID_HERE", // ← Replace with your Package ID
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
```

### 2. Install Tailwind CSS (if not already done)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Make sure `tailwind.config.js` exists:

```javascript
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

### 3. Start the Development Server

```bash
npm run dev
```

The app will be available at: `http://localhost:5173`

## 🎮 Usage

### Connect Your Wallet

1. Click **"Connect Wallet"** button in the top right
2. Select your Sui wallet
3. Approve the connection

### Create a Proposal

1. Fill in the **Question** field (e.g., "What's the best programming language?")
2. Enter **Option 1** (e.g., "JavaScript")
3. Enter **Option 2** (e.g., "Python")
4. Enter **Option 3** (e.g., "Rust")
5. Click **"Create Proposal"**
6. Approve the transaction in your wallet
7. Wait for confirmation

### Vote on a Proposal

1. Browse **Active Proposals** section
2. Review the options and current vote counts
3. Click **"Vote for Option X"** button
4. Approve the transaction in your wallet
5. Your vote is recorded on-chain!

**Note:** You can only vote once per proposal.

### Close a Proposal

1. Find the proposal you want to close
2. Click **"Close Proposal"** button
3. Approve the transaction
4. The proposal moves to **Voting Results** section

### Search Proposals

Use the search bar to filter proposals by title:
- Type keywords in the search field
- Results update in real-time
- Clear search with the X button

## 📁 Project Structure

```
sui-voting-dapp/
├── voting_dapp/                 # Smart contract
│   ├── sources/
│   │   └── voting_dapp.move    # Main voting contract
│   └── Move.toml
│
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.tsx
│   │   │   ├── CreateProposal.tsx
│   │   │   ├── VotingProposals.tsx
│   │   │   ├── VotingResults.tsx
│   │   │   └── WalletStatus.tsx
│   │   ├── utility/
│   │   │   └── voting.ts       # Transaction builders
│   │   ├── types/
│   │   │   └── voting.ts       # TypeScript types
│   │   ├── networkConfig.ts
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🏗️ Smart Contract Architecture

### Data Structures

**VotingProposal**
```move
public struct VotingProposal has key {
    id: UID,
    question: vector<u8>,           // Question as bytes
    options: vector<vector<u8>>,    // 3 options as bytes
    vote_counts: vector<u64>,       // Vote count per option
    voters: Table<address, u64>,    // Voter → choice mapping
    is_active: bool,                // Active/closed status
    total_votes: u64,               // Total vote count
}
```

**VoteReceipt (NFT)**
```move
public struct VoteReceipt has key, store {
    id: UID,
    proposal_id: address,
    voter: address,
    choice: u64,
    timestamp: u64,
}
```

### Main Functions

**create_proposal**
- Creates a new voting proposal
- Emits `ProposalCreatedEvent`
- Shares the proposal object globally

**cast_vote**
- Records a vote for a proposal
- Validates: proposal is active, user hasn't voted, valid option
- Increments vote count
- Mints a VoteReceipt NFT
- Emits `VoteCastEvent`

**close_proposal**
- Closes a proposal to prevent further voting
- Sets `is_active` to false

### Error Codes

```move
const EAlreadyVoted: u64 = 1;      // User already voted
const EInvalidOption: u64 = 2;     // Invalid option index
const EProposalNotActive: u64 = 3; // Proposal is closed
```

## 🐛 Troubleshooting

### Smart Contract Issues

**Problem:** `Cannot find gas coin`
```bash
# Solution: Get more testnet tokens
Visit: https://faucet.sui.io/
```

**Problem:** Build warnings
```
# These are just warnings, deployment will still work
# The contract will function correctly
```

### Frontend Issues

**Problem:** `Package ID is undefined`
```typescript
// Solution: Check networkConfig.ts
// Make sure packageId is set correctly
packageId: "0x...",  // Must start with 0x
```

**Problem:** `No proposals found`
```
Solutions:
1. Check console for errors (F12)
2. Verify Package ID is correct
3. Create a proposal first
4. Refresh the page
```

**Problem:** `Failed to cast vote`
```
Common causes:
- Already voted on this proposal
- Proposal is closed
- Insufficient gas
- Wallet not connected
```

**Problem:** Tailwind styles not working
```bash
# Make sure these files exist:
# - tailwind.config.js
# - postcss.config.js
# - index.css starts with @tailwind directives

# If not, reinstall:
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 🌐 Deployment

### Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

### Deploy Frontend to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod
```

## 🔐 Security Considerations

- ✅ One vote per user per proposal (enforced on-chain)
- ✅ Vote history is immutable
- ✅ Proposal can only be closed, not deleted
- ✅ All transactions are transparent and verifiable
- ⚠️ No admin controls (truly decentralized)
- ⚠️ Proposals cannot be edited after creation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Sui Foundation](https://sui.io/) for the blockchain platform
- [Mysten Labs](https://mystenlabs.com/) for development tools
- [Sui Move](https://docs.sui.io/learn/move) documentation

## 📞 Support

If you have any questions or issues:

- Open an issue on GitHub
- Join [Sui Discord](https://discord.gg/sui)
- Check [Sui Documentation](https://docs.sui.io/)

---

**Made with ❤️ for the Sui ecosystem**