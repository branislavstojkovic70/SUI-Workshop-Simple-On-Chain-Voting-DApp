import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useState } from "react";
import { createProposal } from "../utility/voting";
import { useNetworkVariable } from "../networkConfig";

interface CreateProposalProps {
  refreshKey: number;
  setRefreshKey: (key: number) => void;
}

export function CreateProposal({ refreshKey, setRefreshKey }: CreateProposalProps) {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [question, setQuestion] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProposal = () => {
    if (!account || !question || !option1 || !option2 || !option3) {
      alert("Please fill in all fields!");
      return;
    }

    setIsLoading(true);

    const tx = createProposal(
      packageId,
      question,
      option1,
      option2,
      option3
    );

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          alert("Proposal created successfully!");
          setQuestion("");
          setOption1("");
          setOption2("");
          setOption3("");
          setRefreshKey(refreshKey + 1);
          setIsLoading(false);
        },
        onError: (error) => {
          console.error("Error creating proposal:", error);
          alert(`Failed to create proposal: ${error.message}`);
          setIsLoading(false);
        },
      }
    );
  };

  if (!account) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-white">Create New Proposal</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-teal-400 font-semibold mb-2 text-sm">
            Question
          </label>
          <input
            type="text"
            placeholder="What should we vote on? (e.g., Best pizza topping?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-teal-400 font-semibold mb-2 text-sm">
            Option 1
          </label>
          <input
            type="text"
            placeholder="First option (e.g., Pineapple - controversial!)"
            value={option1}
            onChange={(e) => setOption1(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-teal-400 font-semibold mb-2 text-sm">
            Option 2
          </label>
          <input
            type="text"
            placeholder="Second option (e.g., Pepperoni - classic)"
            value={option2}
            onChange={(e) => setOption2(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-teal-400 font-semibold mb-2 text-sm">
            Option 3
          </label>
          <input
            type="text"
            placeholder="Third option (e.g., Mushrooms - for the veggie lovers)"
            value={option3}
            onChange={(e) => setOption3(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          onClick={handleCreateProposal}
          disabled={isLoading}
          className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl hover:from-teal-600 hover:to-emerald-600 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </span>
          ) : (
            "Create Proposal"
          )}
        </button>
      </div>
    </div>
  );
}