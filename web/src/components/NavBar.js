"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth";
import { useEffect, useState } from "react";
import { getBalance } from "../lib/stellar";

export default function NavBar() {
  const { user, logout, loading } = useAuth();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!user?.walletAddress) { setBalance(null); return; }
    let cancelled = false;
    async function fetchBalance() {
      const bal = await getBalance(user.walletAddress);
      if (!cancelled) setBalance(parseFloat(bal).toFixed(2));
    }
    fetchBalance();
    // Poll every 15 seconds for real-time updates
    const interval = setInterval(fetchBalance, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.walletAddress]);

  return (
    <header className="border-b border-ink-line">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-mono text-sm tracking-tagwide text-signal-gold">SP</span>
          <span className="font-mono text-sm text-bone-dim group-hover:text-bone transition-colors">
            skillpay<span className="text-bone-faint">/ledger</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-bone-dim">
          <Link href="/challenges" className="hover:text-bone transition-colors">
            Challenges
          </Link>
          {user?.role === "mentor" && (
            <Link href="/challenges/new" className="hover:text-bone transition-colors">
              New challenge
            </Link>
          )}
          {user && (
            <Link href="/dashboard" className="hover:text-bone transition-colors">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {loading ? null : user ? (
            <>
              {balance !== null && (
                <span className="hidden md:flex items-center gap-1.5 text-xs font-mono bg-ink-raised border border-ink-line rounded-sm px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-gold inline-block animate-pulse" />
                  <span className="text-signal-gold font-medium">{balance}</span>
                  <span className="text-bone-faint">XLM</span>
                </span>
              )}
              
              {/* Notifications Dropdown Placeholder */}
              <div className="relative group">
                <button className="text-bone-dim hover:text-signal-gold transition-colors relative flex items-center justify-center p-1" aria-label="Notifications">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                  <span className="absolute top-0 right-0 w-2 h-2 bg-signal-rust rounded-full"></span>
                </button>
                <div className="absolute right-0 mt-2 w-64 bg-ink border border-ink-line shadow-lg rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-3 border-b border-ink-line">
                    <h3 className="text-sm font-medium text-bone">Notifications</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="p-3 border-b border-ink-line hover:bg-ink-raised cursor-pointer">
                      <p className="text-xs text-bone-dim">Welcome to SkillPay! Complete your profile to get started.</p>
                      <span className="text-[10px] text-bone-faint mt-1 block">Just now</span>
                    </div>
                    {user.role === 'mentor' ? (
                      <div className="p-3 hover:bg-ink-raised cursor-pointer">
                        <p className="text-xs text-bone-dim">Post your first challenge to attract learners!</p>
                        <span className="text-[10px] text-bone-faint mt-1 block">2 hours ago</span>
                      </div>
                    ) : (
                      <div className="p-3 hover:bg-ink-raised cursor-pointer">
                        <p className="text-xs text-bone-dim">New challenges are available to solve!</p>
                        <span className="text-[10px] text-bone-faint mt-1 block">1 day ago</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href="/profile"
                className="font-mono text-xs text-bone-dim hover:text-signal-gold transition-colors"
              >
                {user.walletAddress?.slice(0, 4)}…{user.walletAddress?.slice(-4)}
              </Link>
              <button
                onClick={logout}
                className="text-xs text-bone-faint hover:text-signal-rust transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-bone-dim hover:text-bone transition-colors">
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-signal-gold text-ink px-4 py-1.5 rounded-sm hover:bg-signal-gold/90 transition-colors font-medium"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
