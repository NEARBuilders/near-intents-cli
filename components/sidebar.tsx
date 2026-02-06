'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, Coins, Zap, Send, LogOut, Settings } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6">
      <div className="mb-12">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">NEAR Intents</h1>
        </div>
      </div>

      <nav className="space-y-2">
        <Link
          href="/"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
            isActive('/') 
              ? 'bg-emerald-500 text-white' 
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Wallet className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/tokens"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
            isActive('/tokens') 
              ? 'bg-emerald-500 text-white' 
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Coins className="h-5 w-5" />
          <span>Tokens</span>
        </Link>

        <Link
          href="/balances"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
            isActive('/balances') 
              ? 'bg-emerald-500 text-white' 
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Wallet className="h-5 w-5" />
          <span>Balances</span>
        </Link>

        <Link
          href="/swap"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
            isActive('/swap') 
              ? 'bg-emerald-500 text-white' 
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Zap className="h-5 w-5" />
          <span>Swap</span>
        </Link>

        <Link
          href="/deposit"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
            isActive('/deposit') 
              ? 'bg-emerald-500 text-white' 
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Send className="h-5 w-5" />
          <span>Deposit</span>
        </Link>

        <Link
          href="/transfer"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
            isActive('/transfer') 
              ? 'bg-emerald-500 text-white' 
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Send className="h-5 w-5" />
          <span>Transfer</span>
        </Link>

        <Link
          href="/withdraw"
          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
            isActive('/withdraw') 
              ? 'bg-emerald-500 text-white' 
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <LogOut className="h-5 w-5" />
          <span>Withdraw</span>
        </Link>
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-slate-300 hover:bg-slate-700 transition-all">
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
