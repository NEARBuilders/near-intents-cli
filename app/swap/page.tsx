'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout';

export default function SwapPage() {
  const [formData, setFormData] = useState({
    from_token: '',
    to_token: '',
    amount: '',
    account_id: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.from_token || !formData.to_token || !formData.amount || !formData.account_id) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setFormData({ from_token: '', to_token: '', amount: '', account_id: '' });
      } else {
        setError(data.error || 'Failed to execute swap');
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
          <h1 className="text-4xl font-bold text-white mb-2">Swap Tokens</h1>
          <p className="text-slate-400">Exchange tokens across different chains</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Swap Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">From Token</label>
                <input
                  type="text"
                  name="from_token"
                  value={formData.from_token}
                  onChange={handleChange}
                  placeholder="e.g., near or token address"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">To Token</label>
                <input
                  type="text"
                  name="to_token"
                  value={formData.to_token}
                  onChange={handleChange}
                  placeholder="e.g., usdt.tether-token.near"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Account ID</label>
                <input
                  type="text"
                  name="account_id"
                  value={formData.account_id}
                  onChange={handleChange}
                  placeholder="e.g., account.near"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 px-6 py-3 text-white transition-colors font-medium"
              >
                {isLoading ? 'Processing...' : 'Execute Swap'}
              </button>
            </form>
          </div>

          <div>
            {error && (
              <div className="mb-6 rounded-lg border border-red-700 bg-red-900/20 p-4 text-red-300">
                {error}
              </div>
            )}

            {result && (
              <div className="rounded-lg border border-emerald-700 bg-emerald-900/20 p-6">
                <h3 className="text-lg font-semibold text-emerald-400 mb-4">Swap Successful! ✓</h3>
                <div className="space-y-3 text-sm text-slate-300">
                  <div>
                    <p className="text-slate-400">Transaction ID</p>
                    <p className="font-mono text-xs break-all text-emerald-400">{JSON.stringify(result).substring(0, 50)}...</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <p className="text-emerald-400">Completed</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
