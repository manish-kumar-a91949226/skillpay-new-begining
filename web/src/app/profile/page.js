"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .myProfile()
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return <div className="max-w-3xl mx-auto px-6 py-20 text-bone-faint">Loading profile…</div>;
  }
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <p className="text-bone-dim">
          <a href="/login" className="text-signal-gold hover:underline">
            Log in
          </a>{" "}
          to view your profile.
        </p>
      </div>
    );
  }

  const { rewards = [] } = data || {};

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-2xl font-medium mb-1">{user.name}</h1>
      <p className="text-bone-faint text-sm font-mono mb-8">{user.walletAddress}</p>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <Stat label="Rewards earned" value={`${user.totalRewards} XLM`} accent />
        <Stat label="Challenges completed" value={user.challengesCompleted} />
        <Stat label="Badges" value={user.badges?.length || 0} />
      </div>

      {user.badges?.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-mono text-bone-dim uppercase tracking-tagwide mb-3">Badges</h2>
          <div className="flex gap-2 flex-wrap">
            {user.badges.map((b) => (
              <span key={b} className="tag text-signal-gold border-signal-gold">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-mono text-bone-dim uppercase tracking-tagwide mb-3">
        Settlement history
      </h2>
      {rewards.length === 0 ? (
        <p className="text-bone-faint text-sm">No rewards settled yet — go submit something.</p>
      ) : (
        <div className="ledger">
          {rewards.map((r) => (
            <div key={r._id} className="ledger-row grid-cols-[1fr_100px_140px] gap-6 items-center">
              <span className="text-bone">{r.challengeId?.title}</span>
              <span className="mono-amount text-signal-gold text-right">{r.amount} XLM</span>
              <span className="font-mono text-xs text-bone-faint text-right truncate">
                {r.txHash?.slice(0, 10)}…
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="border border-ink-line rounded-sm p-5">
      <p className="text-bone-faint text-xs font-mono uppercase tracking-tagwide mb-2">{label}</p>
      <p className={`text-2xl mono-amount ${accent ? "text-signal-gold" : "text-bone"}`}>{value}</p>
    </div>
  );
}
