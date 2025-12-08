import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { castVote, closeProposal } from "../utility/voting";
import { useState, useEffect, useMemo } from "react";

interface VotingProposalsProps {
  refreshKey: number;
  setRefreshKey: (key: number) => void;
}

export function VotingProposals({ refreshKey, setRefreshKey }: VotingProposalsProps) {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [loadingVote, setLoadingVote] = useState<string | null>(null);
  const [loadingClose, setLoadingClose] = useState<string | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 5;

  // Fetch proposals using ProposalCreatedEvent
  useEffect(() => {
    const fetchProposals = async () => {
      if (!packageId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const events = await suiClient.queryEvents({
          query: {
            MoveEventType: `${packageId}::simple_voting::ProposalCreatedEvent`
          },
          limit: 50,
        });
        
        if (events.data.length === 0) {
          setProposals([]);
          setLoading(false);
          return;
        }
        
        const proposalIds = events.data.map((event: any) => 
          event.parsedJson?.proposal_id
        ).filter(Boolean);
        
        if (proposalIds.length === 0) {
          setProposals([]);
          setLoading(false);
          return;
        }
        
        const proposalObjects = await suiClient.multiGetObjects({
          ids: proposalIds,
          options: {
            showContent: true,
            showType: true,
            showOwner: true,
          },
        });
        
        const validProposals = proposalObjects.filter((obj: any) => 
          obj.data && !obj.error
        );
        
        setProposals(validProposals);
        
      } catch (err: any) {
        console.error("Error fetching proposals:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [packageId, suiClient, refreshKey]);

  const handleVote = (proposalId: string, choice: number) => {
    if (!account) return;

    setLoadingVote(`${proposalId}-${choice}`);

    const tx = castVote(packageId, proposalId, choice);

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log("Vote cast successfully!", result);
          alert(`Vote cast successfully for option ${choice + 1}!`);
          setRefreshKey(refreshKey + 1);
          setLoadingVote(null);
        },
        onError: (error) => {
          console.error("Error casting vote:", error);
          alert(`Failed to cast vote: ${error.message}`);
          setLoadingVote(null);
        },
      }
    );
  };

  const handleCloseProposal = (proposalId: string) => {
    if (!account) return;

    setLoadingClose(proposalId);

    const tx = closeProposal(packageId, proposalId);

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log("Proposal closed successfully!", result);
          alert("Proposal closed successfully!");
          setRefreshKey(refreshKey + 1);
          setLoadingClose(null);
        },
        onError: (error) => {
          console.error("Error closing proposal:", error);
          alert(`Failed to close proposal: ${error.message}`);
          setLoadingClose(null);
        },
      }
    );
  };

  // Filter active proposals and apply search
  const filteredProposals = useMemo(() => {
    const active = proposals?.filter((obj) => {
      const content = obj.data?.content as any;
      return content?.fields?.is_active === true;
    });

    if (!searchQuery.trim()) return active;

    return active?.filter((proposal) => {
      const content = proposal.data?.content as any;
      const fields = content?.fields;
      if (!fields) return false;

      const question = new TextDecoder().decode(
        new Uint8Array(fields.question)
      ).toLowerCase();

      return question.includes(searchQuery.toLowerCase());
    });
  }, [proposals, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil((filteredProposals?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProposals = filteredProposals?.slice(startIndex, endIndex) || [];

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (!account) {
    return (
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-white">Connect Wallet to Vote</h2>
          <p className="text-gray-400">Please connect your wallet to see and vote on proposals</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-teal-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-300 text-lg">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-900/30 to-gray-900 border border-red-500/30 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400">Error Loading Proposals</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-white">Active Proposals</h2>
        </div>
        <span className="px-4 py-2 bg-teal-500 text-white font-bold rounded-full text-sm">
          {filteredProposals?.length || 0} Active
        </span>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search proposals by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-400">
            Found {filteredProposals?.length || 0} proposal{filteredProposals?.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Proposals List */}
      {!filteredProposals || filteredProposals.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <h3 className="text-xl font-semibold text-gray-300">
            {searchQuery ? "No proposals match your search" : "No active proposals yet"}
          </h3>
          <p className="text-gray-500">
            {searchQuery ? "Try a different search term" : "Create the first one above!"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6 mb-6">
            {currentProposals.map((proposal) => {
              const content = proposal.data?.content as any;
              const fields = content?.fields;
              const proposalId = proposal.data?.objectId;

              if (!fields || !proposalId) {
                console.warn("Invalid proposal data:", proposal);
                return null;
              }

              const question = new TextDecoder().decode(
                new Uint8Array(fields.question)
              );

              const options = fields.options.map((optionBytes: number[]) =>
                new TextDecoder().decode(new Uint8Array(optionBytes))
              );

              const hasVoted = fields.voters?.fields?.contents?.some(
                (voter: any) => voter.fields?.key === account.address
              );

              return (
                <div
                  key={proposalId}
                  className="bg-gradient-to-br from-teal-900/20 to-emerald-900/20 border-2 border-teal-500/50 rounded-2xl p-6 shadow-2xl hover:shadow-teal-500/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex-1">
                      {question}
                    </h3>
                    {hasVoted && (
                      <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full ml-4">
                        Voted
                      </span>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm mb-6">
                    Total Votes: <span className="text-teal-400 font-semibold">{fields.total_votes}</span>
                  </p>

                  <div className="space-y-4">
                    {options.map((option: string, index: number) => {
                      const voteCount = fields.vote_counts[index];
                      const percentage = fields.total_votes > 0
                        ? ((voteCount / fields.total_votes) * 100).toFixed(1)
                        : "0";

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white font-semibold">
                              Option {index + 1}: {option}
                            </span>
                            <span className="text-gray-400">
                              {voteCount} votes ({percentage}%)
                            </span>
                          </div>

                          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <button
                            onClick={() => handleVote(proposalId, index)}
                            disabled={hasVoted || loadingVote === `${proposalId}-${index}`}
                            className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-emerald-600 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {loadingVote === `${proposalId}-${index}` ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Voting...
                              </span>
                            ) : hasVoted ? (
                              "Already Voted"
                            ) : (
                              `Vote for Option ${index + 1}`
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleCloseProposal(proposalId)}
                    disabled={loadingClose === proposalId}
                    className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loadingClose === proposalId ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Closing...
                      </span>
                    ) : (
                      "Close Proposal"
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredProposals.length)} of {filteredProposals.length}
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg transition-all ${
                        currentPage === page
                          ? "bg-teal-500 text-white font-semibold"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}