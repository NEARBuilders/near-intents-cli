'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout';
import { TokensList } from '@/components/tokens-list';

export default function TokensPage() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tokens');
        const data = await response.json();

        if (data.success) {
          setTokens(data.data || []);
        } else {
          setError(data.error || 'Failed to fetch tokens');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Tokens</h1>
          <p className="text-slate-400">Browse and manage available tokens</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-900/20 p-4 text-red-300">
            {error}
          </div>
        )}

        <TokensList tokens={tokens} isLoading={isLoading} />

        {!isLoading && tokens.length > 0 && (
          <div className="mt-6 text-sm text-slate-400">
            Showing {tokens.length} token{tokens.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Layout>
  );
}
