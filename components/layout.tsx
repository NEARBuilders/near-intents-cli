'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 flex-1">
        <div className="min-h-screen p-8">{children}</div>
      </main>
    </div>
  );
}
