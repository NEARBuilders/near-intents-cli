'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout';

export default function DepositPage() {
  const [accountId, setAccountId] = useState('');
  const [depositAddress, setDepositAddress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim()) {
      setError('Please enter an account ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId }),
      });

      const data = await response.json();

      if (data.success) {
        setDepositAddress(data.data);
      } else {
        setError(data.error || 'Failed to get deposit address');
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
          <h1 className="text-4xl font-bold text-white mb-2">Deposit</h1>
          <p className="text-slate-400">Get your unique deposit address to receive funds</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Generate Deposit Address</h2>
            <form onSubmit={handleGetDeposit} className="space-y-4">
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
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 px-6 py-3 text-white transition-colors font-medium"
              >
                {isLoading ? 'Generating...' : 'Get Deposit Address'}
              </button>
            </form>
          </div>

          <div>
            {error && (
              <div className="mb-6 rounded-lg border border-red-700 bg-red-900/20 p-4 text-red-300">
                {error}
              </div>
            )}

            {depositAddress && (
              <div className="rounded-lg border border-emerald-700 bg-emerald-900/20 p-6">
                <h3 className="text-lg font-semibold text-emerald-400 mb-4">Your Deposit Address</h3>
                <div className="space-y-4">
                  <div className="rounded-lg bg-slate-900 p-4 break-all">
                    <p className="text-sm text-slate-400 mb-2">Address</p>
                    <p className="font-mono text-emerald-400 text-xs">{JSON.stringify(depositAddress.address || depositAddress)}</p>
                  </div>

                  {depositAddress.chain && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Chain</p>
                      <p className="font-semibold text-white">{depositAddress.chain}</p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(depositAddress.address || depositAddress)
                      );
                    }}
                    className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-slate-300 transition-colors text-sm"
                  >
                    Copy Address
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
