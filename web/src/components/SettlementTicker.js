"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

function truncateHash(hash) {
  if (!hash) return "—";
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export default function SettlementTicker() {
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    api
      .recentRewardsFeed()
      .then(({ rewards }) =>
        setRewards(
          rewards.map((r) => ({
            learnerName: r.learnerId?.name || "learner",
            amount: r.amount,
            challengeTitle: r.challengeId?.title || "challenge",
            txHash: r.txHash,
          }))
        )
      )
      .catch(() => setRewards([]));
  }, []);

  const items = rewards.length > 0 ? rewards : PLACEHOLDER;
  const doubled = [...items, ...items];

  return (
    <div className="border-y border-ink-line bg-ink-raised overflow-hidden">
      <div className="settle-track py-3">
        {doubled.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-6 font-mono text-xs whitespace-nowrap border-r border-ink-line"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-signal-gold animate-pulse-dot" />
            <span className="text-bone-dim">{r.learnerName}</span>
            <span className="text-bone-faint">settled</span>
            <span className="text-signal-gold mono-amount">{r.amount} XLM</span>
            <span className="text-bone-faint">for</span>
            <span className="text-bone-dim">{r.challengeTitle}</span>
            <span className="text-bone-faint">·</span>
            <span className="text-bone-faint">{truncateHash(r.txHash)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PLACEHOLDER = [
  { learnerName: "anika_r", amount: "50", challengeTitle: "Personal Portfolio", txHash: "8f2a9cd1e7b04f6a" },
  { learnerName: "devesh_k", amount: "100", challengeTitle: "REST API Challenge", txHash: "3bc71029fa48ee10" },
  { learnerName: "priya_s", amount: "75", challengeTitle: "React Dashboard", txHash: "a19c003fd821b6e4" },
  { learnerName: "rohit_m", amount: "120", challengeTitle: "Smart Contract Audit", txHash: "5ed94f1c0a3b8722" },
];
