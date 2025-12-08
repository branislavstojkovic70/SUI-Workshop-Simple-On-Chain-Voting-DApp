import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";

export function WalletStatus() {
  const account = useCurrentAccount();

  const { data: balance } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
    },
    {
      enabled: !!account,
    }
  );

  if (!account) {
    return (
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-bold text-white">Wallet Not Connected</h2>
          <p className="text-gray-400">Please connect your wallet to start voting</p>
        </div>
      </div>
    );
  }

  const suiBalance = balance ? (Number(balance.totalBalance) / 1_000_000_000).toFixed(4) : "0.0000";

  return (
    <div className="bg-gradient-to-r from-teal-900/30 to-emerald-900/30 border border-teal-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-teal-400 flex items-center gap-2">
          Wallet Connected
        </h2>
        <span className="px-3 py-1 bg-teal-500 text-white text-sm font-semibold rounded-full">
          Active
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm font-medium">Address:</span>
          <span className="text-gray-300 font-mono text-sm">
            {account.address.slice(0, 8)}...{account.address.slice(-6)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm font-medium">Balance:</span>
          <span className="text-teal-400 font-bold text-lg">
            {suiBalance} SUI
          </span>
        </div>
      </div>
    </div>
  );
}