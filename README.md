# Sui On-Chain Voting DApp

A decentralized voting application built on Sui blockchain where users can create proposals and cast votes on-chain. Features real-time results, one-vote-per-user enforcement, and proposal management.

![Sui](https://img.shields.io/badge/Sui-Testnet-blue)
![Move](https://img.shields.io/badge/Move-Smart_Contract-orange)
![React](https://img.shields.io/badge/React-TypeScript-blue)

## Project Overview

This project demonstrates:
- On-chain proposal creation and voting
- One vote per user per proposal (enforced on-chain)
- Real-time vote counting and results
- Proposal lifecycle management (active/closed)
- Modern React UI with TypeScript and Tailwind CSS
- Event-based data fetching from blockchain

## Features

- **Create Proposals**: Anyone can create voting proposals with 3 options
- **Cast Votes**: Vote on active proposals (one vote per wallet)
- **Real-time Results**: Live vote counts with visual progress bars
- **Proposal Management**: Close proposals to end voting
- **Search & Filter**: Search proposals by title
- **Pagination**: Navigate through proposals easily
- **Vote Receipts**: On-chain proof of voting
- **Teal/Emerald Theme**: Modern gradient design

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- @mysten/dapp-kit
- @mysten/sui

**Blockchain:**
- Sui Move on Testnet

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Sui CLI](https://docs.sui.io/build/install)
- [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet) browser extension
- Testnet SUI tokens from https://faucet.sui.io/

## Project Structure

```
voting/
├── voting_dapp/                # Smart contract
│   ├── sources/
│   │   └── simple_voting.move # Main Move contract
│   └── Move.toml
│
└── frontend/                   # React application
    ├── src/
    │   ├── components/
    │   │   ├── App.tsx
    │   │   ├── CreateProposal.tsx
    │   │   ├── VotingProposals.tsx
    │   │   ├── VotingResults.tsx
    │   │   └── WalletStatus.tsx
    │   ├── utility/
    │   │   └── voting.ts
    │   ├── networkConfig.ts
    │   └── main.tsx
    └── package.json
```

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/sui-voting.git
cd sui-voting
```

### 2. Deploy Smart Contract

```bash
cd voting_dapp

# Switch to testnet
sui client switch --env testnet

# Build the contract
sui move build

# Deploy to testnet
sui client publish --gas-budget 100000000
```

**Important:** Save the Package ID from the deployment output.

Example output:
```
Published Objects:
  PackageID: 0x123abc...
```

Note: The contract automatically creates a sample proposal in the `init` function.

### 3. Configure Frontend

Edit `frontend/src/networkConfig.ts`:

```typescript
const packageId = "YOUR_PACKAGE_ID_HERE";
```

### 4. Install Dependencies & Run

```bash
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:5173`

## Smart Contract Architecture

### Main Structures

```move
public struct VotingProposal has key {
    id: UID,
    question: vector<u8>,
    options: vector<vector<u8>>,
    vote_counts: vector<u64>,
    voters: Table<address, u64>,
    is_active: bool,
    total_votes: u64,
}

public struct VoteReceipt has key, store {
    id: UID,
    proposal_id: address,
    voter: address,
    choice: u64,
    timestamp: u64,
}
```

### Key Functions

**create_proposal**
- Create a new voting proposal with question and 3 options
- Proposal is shared object (accessible to all)
- Emits ProposalCreatedEvent

**cast_vote**
- Vote on an active proposal
- Enforces: one vote per address
- Validates: proposal is active, option is valid
- Issues VoteReceipt NFT to voter
- Emits VoteCastEvent

**close_proposal**
- Mark proposal as inactive
- Prevents further voting
- Anyone can close any proposal

**Getter Functions**
- `get_proposal_id()` - Get proposal address
- `get_question()` - Get question text
- `get_options()` - Get all options
- `get_vote_counts()` - Get vote counts
- `get_total_votes()` - Total votes cast
- `is_active()` - Check if active
- `has_voted()` - Check if address voted
- `get_user_vote()` - Get user's choice

### Error Codes

```move
const EAlreadyVoted: u64 = 1;       // User already voted
const EInvalidOption: u64 = 2;      // Invalid option index
const EProposalNotActive: u64 = 3;  // Proposal is closed
```

## Usage

### Create a Proposal

1. Connect your Sui wallet
2. Fill in the proposal question
3. Enter three voting options
4. Click "Create Proposal"
5. Approve the transaction
6. Proposal appears in Active Proposals section

### Vote on a Proposal

1. Browse active proposals
2. Read the question and options
3. Click "Vote for Option X"
4. Approve the transaction
5. Receive VoteReceipt NFT
6. Results update in real-time

### Close a Proposal

1. Find the proposal to close
2. Click "Close Proposal" button
3. Approve the transaction
4. Proposal moves to Results section

### View Results

1. Navigate to Voting Results section
2. See all closed proposals
3. Winner highlighted with star
4. Visual breakdown of all votes

## Features Explained

### One Vote Per User

The contract enforces one vote per wallet address using an on-chain `Table<address, u64>`. Once a user votes, they cannot vote again on the same proposal.

### Vote Receipts

Each vote generates a VoteReceipt NFT that:
- Proves the user voted
- Records their choice
- Includes timestamp
- Stored in user's wallet

### Proposal Lifecycle

1. **Created**: Anyone can create proposals
2. **Active**: Users can vote
3. **Closed**: No more voting, results visible

### Real-time Updates

The UI automatically fetches:
- New proposals via ProposalCreatedEvent
- Vote updates from on-chain state
- Results from closed proposals

## Enoki Gas Sponsorship (Optional)

To enable gas-free transactions:

### Setup

1. Visit https://enoki.mystenlabs.com/
2. Create account and new app
3. Create Private API Key with "Sponsored Transactions" enabled

### Configuration

In Enoki portal, add allowed move call targets:
```
{PACKAGE_ID}::simple_voting::create_proposal
{PACKAGE_ID}::simple_voting::cast_vote
{PACKAGE_ID}::simple_voting::close_proposal
```

### Implementation

Requires backend API endpoint for sponsorship. See Enoki documentation for details:
https://docs.enoki.mystenlabs.com/

Note: Enoki sponsorship is optional. The app works without it (users pay their own gas).

## Sample Proposal

The contract includes a fun sample proposal in the init function:

**Question:** "What should we do to make people smile today?"

**Options:**
1. Help Mr. Frog find his dollar (he really needs it)
2. Let Pim organize another overly enthusiastic adventure
3. Just let Charlie be cynical and depressed in peace

This demonstrates the voting system with a lighthearted example!

## Deployment

### Deploy to Vercel

```bash
cd frontend
npm install -g vercel
vercel --prod
```

Add environment variable:
```
VITE_PACKAGE_ID=your_package_id_here
```

### Deploy to Netlify

```bash
cd frontend
npm install -g netlify-cli
netlify deploy --prod
```

## Troubleshooting

### "Already Voted"
**Solution:** You can only vote once per proposal. This is enforced on-chain for fairness.

### "Invalid Option"
**Solution:** You tried to vote for an option that doesn't exist. Choose option 1, 2, or 3.

### "Proposal Not Active"
**Solution:** The proposal has been closed. View results in the Voting Results section.

### No Proposals Showing
**Solutions:**
- Verify Package ID in networkConfig.ts
- Check contract is deployed on testnet
- View on Sui Explorer: https://suiscan.xyz/testnet
- Create a new proposal to test

### Transaction Fails
**Common causes:**
- Insufficient balance (get tokens from faucet)
- Not connected to testnet network
- Wrong Package ID in config

## Verification

After deployment, verify on Sui Explorer:
- Visit: https://suiscan.xyz/testnet
- Search for your Package ID
- View all proposals and votes

## Customization

### Add More Options

In `simple_voting.move`, modify `create_proposal`:
```move
// Add 4th option
vector::push_back(&mut options, option4);
vector::push_back(&mut vote_counts, 0);
```

Update frontend to handle 4 options.

### Change Theme

In components, replace color classes:
- `teal-` with your primary color
- `emerald-` with your accent color

### Proposal Permissions

To restrict proposal creation:
```move
// Add AdminCap in init
public struct AdminCap has key, store { id: UID }

// Require AdminCap for create_proposal
public entry fun create_proposal(
    _admin: &AdminCap,
    // ... other params
)
```

## Security & Privacy

- One vote per address (enforced on-chain)
- Votes are permanent and public
- VoteReceipt NFT serves as proof
- All votes visible on blockchain
- No vote modification after submission
- Proposal closing is unrestricted (anyone can close)

## Use Cases

Perfect for:
- **DAO Governance**: Community decision making
- **Team Polls**: Internal team voting
- **Community Surveys**: Public opinion gathering
- **Feature Voting**: Product roadmap decisions
- **Event Planning**: Group activity selection

## License

MIT License

## Acknowledgments

- [Sui Foundation](https://sui.io/)
- [Mysten Labs](https://mystenlabs.com/)
- Inspired by Smiling Friends (sample proposal reference)

## Support

- [GitHub Issues](https://github.com/yourusername/sui-voting/issues)
- [Sui Discord](https://discord.gg/sui)
- [Sui Docs](https://docs.sui.io/)