import { useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { useState, useEffect, useMemo } from "react";

interface VotingResultsProps {
  refreshKey: number;
}

export function VotingResults({ refreshKey }: VotingResultsProps) {
  const packageId = useNetworkVariable("packageId");
  const suiClient = useSuiClient();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 5;

  // Fetch proposals using ProposalCreatedEvent
  useEffect(() => {
    const fetchProposals = async () => {
      if (!packageId) return;
      
      setLoading(true);
      
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
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [packageId, suiClient, refreshKey]);

  // Filter closed proposals and apply search
  const filteredProposals = useMemo(() => {
    const closed = proposals?.filter((obj) => {
      const content = obj.data?.content as any;
      return content?.fields?.is_active === false;
    });

    if (!searchQuery.trim()) return closed;

    return closed?.filter((proposal) => {
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

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-xl">
        <div className="flex justify-center">
          <p className="text-gray-300">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-white">Voting Results</h2>
        </div>
        <span className="px-4 py-2 bg-purple-500 text-white font-bold rounded-full text-sm">
          {filteredProposals?.length || 0} Completed
        </span>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search completed proposals by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
            Found {filteredProposals?.length || 0} result{filteredProposals?.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Results List */}
      {!filteredProposals || filteredProposals.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <h3 className="text-xl font-semibold text-gray-300">
            {searchQuery ? "No results match your search" : "No completed proposals yet"}
          </h3>
          <p className="text-gray-500">
            {searchQuery ? "Try a different search term" : "Results will appear here when proposals are closed"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6 mb-6">
            {currentProposals.map((proposal) => {
              const content = proposal.data?.content as any;
              const fields = content?.fields;
              const proposalId = proposal.data?.objectId;

              if (!fields || !proposalId) return null;

              const question = new TextDecoder().decode(
                new Uint8Array(fields.question)
              );

              const options = fields.options.map((optionBytes: number[]) =>
                new TextDecoder().decode(new Uint8Array(optionBytes))
              );

              const maxVotes = Math.max(...fields.vote_counts);
              const winnerIndex = fields.vote_counts.indexOf(maxVotes);

              return (
                <div
                  key={proposalId}
                  className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-2 border-purple-500/50 rounded-2xl p-6 shadow-2xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex-1">
                      {question}
                    </h3>
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full ml-4">
                      Closed
                    </span>
                  </div>

                  <div className="mb-4 p-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/30 rounded-xl">
                    <p className="text-yellow-400 font-bold text-lg">
                      Winner: {options[winnerIndex]} ({maxVotes} votes)
                    </p>
                  </div>

                  <p className="text-gray-400 text-sm mb-6">
                    Total Votes: <span className="text-purple-400 font-semibold">{fields.total_votes}</span>
                  </p>

                  <div className="space-y-4">
                    {options.map((option: string, index: number) => {
                      const voteCount = fields.vote_counts[index];
                      const percentage = fields.total_votes > 0
                        ? (voteCount / fields.total_votes) * 100
                        : 0;

                      const isWinner = index === winnerIndex;

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white font-semibold flex items-center gap-2">
                              {isWinner && <span className="text-yellow-400">★</span>}
                              Option {index + 1}: {option}
                            </span>
                            <span className="text-gray-400">
                              {voteCount} votes ({percentage.toFixed(1)}%)
                            </span>
                          </div>

                          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isWinner
                                  ? "bg-gradient-to-r from-yellow-400 to-amber-400"
                                  : "bg-gradient-to-r from-purple-400 to-pink-400"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                          ? "bg-purple-500 text-white font-semibold"
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