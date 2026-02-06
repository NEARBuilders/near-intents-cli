'use client';

import { Layout } from '@/components/layout';

export default function Dashboard() {
  return (
    <Layout>
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Welcome to NEAR Intents - Your cross-chain DeFi hub</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Balances</h3>
            <p className="text-slate-400">Check your wallet balances across multiple tokens</p>
            <button className="mt-4 inline-block rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-white transition-colors">
              View Balances →
            </button>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Swap Tokens</h3>
            <p className="text-slate-400">Exchange tokens across different chains instantly</p>
            <button className="mt-4 inline-block rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-white transition-colors">
              Start Swap →
            </button>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-xl">📥</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Deposit</h3>
            <p className="text-slate-400">Get your unique deposit address for receiving funds</p>
            <button className="mt-4 inline-block rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-white transition-colors">
              Get Deposit Address →
            </button>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-xl">📤</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Withdraw</h3>
            <p className="text-slate-400">Withdraw your tokens to external wallets</p>
            <button className="mt-4 inline-block rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-white transition-colors">
              Withdraw Funds →
            </button>
          </div>
        </div>

        <div className="mt-12 rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Start</h2>
          <div className="space-y-3 text-slate-300">
            <div className="flex gap-3">
              <span className="text-emerald-400 font-bold">1.</span>
              <span>Browse available tokens in the Tokens section</span>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-400 font-bold">2.</span>
              <span>Check your balances across different chains</span>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-400 font-bold">3.</span>
              <span>Swap tokens instantly with competitive rates</span>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-400 font-bold">4.</span>
              <span>Deposit or withdraw funds securely</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
