'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout';

export default function BalancesPage() {
  const [accountId, setAccountId] = useState('');
  const [balances, setBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim()) {
      setError('Please enter an account ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId }),
      });

      const data = await response.json();

      if (data.success) {
        setBalances(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch balances');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Balances</h1>
          <p className="text-slate-400">Check your wallet balances across tokens and chains</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 mb-8">
          <form onSubmit={handleFetchBalances} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Account ID</label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g., account.near"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 px-6 py-2 text-white transition-colors font-medium"
            >
              {isLoading ? 'Fetching...' : 'Fetch Balances'}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-900/20 p-4 text-red-300">
            {error}
          </div>
        )}

        {balances.length > 0 && (
          <div className="space-y-4">
            <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900/50">
              {balances.map((balance: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-800 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium text-white">{balance.symbol || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 font-mono truncate">{balance.token_address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-emerald-400">{balance.balance}</p>
                    <p className="text-xs text-slate-400">{balance.chain || 'Unknown Chain'}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400">Total: {balances.length} token balances</p>
          </div>
        )}

        {!isLoading && balances.length === 0 && accountId && (
          <div className="text-center py-12 text-slate-400">
            No balances found for {accountId}
          </div>
        )}
      </div>
    </Layout>
  );
}
