'use client';

import { useState } from 'react';

interface TokensListProps {
  tokens: any[];
  isLoading?: boolean;
}

export function TokensList({ tokens, isLoading }: TokensListProps) {
  const [search, setSearch] = useState('');

  const filtered = tokens.filter(
    (token) =>
      token.symbol?.toLowerCase().includes(search.toLowerCase()) ||
      token.name?.toLowerCase().includes(search.toLowerCase()) ||
      token.address?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-slate-300">Loading tokens...</div>;
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search tokens..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
      />

      <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900/50">
        {filtered.map((token: any) => (
          <div key={token.address} className="flex items-center justify-between p-4 hover:bg-slate-800 transition-colors">
            <div className="space-y-1">
              <p className="font-medium text-white">{token.symbol}</p>
              <p className="text-sm text-slate-400">{token.name}</p>
              <p className="text-xs text-slate-500 font-mono truncate">{token.address}</p>
            </div>
            {token.decimals && (
              <div className="text-right">
                <p className="text-sm text-slate-300">Decimals: {token.decimals}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No tokens found
        </div>
      )}
    </div>
  );
}
