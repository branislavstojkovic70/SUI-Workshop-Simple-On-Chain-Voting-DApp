import { ConnectButton } from "@mysten/dapp-kit";
import { useState } from "react";
import { WalletStatus } from "./components/WalletStatus";
import { VotingProposals } from "./components/VotingProsposals";
import { VotingResults } from "./components/VotingResults";
import { CreateProposal } from "./components/CreateProposal";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🗳️</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Sui Voting DApp
              </h1>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Wallet Status */}
        <WalletStatus />

        {/* Create Proposal */}
        <CreateProposal 
          refreshKey={refreshKey} 
          setRefreshKey={setRefreshKey} 
        />

        {/* Active Proposals */}
        <VotingProposals
          refreshKey={refreshKey}
          setRefreshKey={setRefreshKey}
        />

        {/* Results */}
        <VotingResults refreshKey={refreshKey} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-xl mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          Built with ❤️ on Sui Network
        </div>
      </footer>
    </div>
  );
}

export default App;