"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "learner") {
      setLoading(false);
      return;
    }
    api
      .mySubmissions()
      .then(({ submissions }) => setSubmissions(submissions))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return <div className="max-w-5xl mx-auto px-6 py-20 text-bone-faint">Loading…</div>;
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <p className="text-bone-dim">
          <a href="/login" className="text-signal-gold hover:underline">
            Log in
          </a>{" "}
          to see your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <div className="mb-10">
        <h1 className="text-2xl font-medium">Welcome back, {user.name}</h1>
        <p className="text-bone-dim text-sm mt-1 capitalize">{user.role} account</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <Stat label="Wallet balance" value={`${user.balance ?? "—"} XLM`} />
        <Stat label="Total earned" value={`${user.totalRewards ?? 0} XLM`} accent />
        <Stat label="Challenges completed" value={user.challengesCompleted ?? 0} />
      </div>

      {user.role === "mentor" ? (
        <div className="space-y-8">
          <div className="border border-ink-line rounded-sm p-6">
            <p className="text-bone-dim text-sm mb-4">
              Post challenges, escrow rewards, and review submissions from the
              challenges section.
            </p>
            <Link
              href="/challenges/new"
              className="text-signal-gold text-sm font-mono hover:underline"
            >
              + post a new challenge
            </Link>
          </div>
          
          <div className="border border-ink-line rounded-sm p-6">
            <h2 className="text-sm font-mono text-bone-dim uppercase tracking-tagwide mb-6">Engagement Overview</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Week 1', submissions: 4 },
                  { name: 'Week 2', submissions: 7 },
                  { name: 'Week 3', submissions: 12 },
                  { name: 'Week 4', submissions: 22 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#2a2a2a', color: '#eaeaea' }} />
                  <Bar dataKey="submissions" fill="#facc15" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-mono text-bone-dim uppercase tracking-tagwide mb-4">
            Your submissions
          </h2>
          {loading && <p className="text-bone-faint text-sm">Loading…</p>}
          {!loading && submissions.length === 0 && (
            <div className="border border-ink-line rounded-sm p-8 text-center">
              <p className="text-bone-dim">No submissions yet.</p>
              <Link href="/challenges" className="text-signal-gold text-sm hover:underline mt-1 inline-block">
                Browse open challenges →
              </Link>
            </div>
          )}
          {!loading && submissions.length > 0 && (
            <div className="ledger">
              {submissions.map((s) => (
                <div key={s._id} className="ledger-row grid-cols-[110px_1fr_100px] gap-6 items-center">
                  <span
                    className={`tag ${
                      s.status === "approved"
                        ? "text-signal-gold border-signal-gold"
                        : s.status === "rejected"
                        ? "text-signal-rust border-signal-rust"
                        : "text-signal-slate border-signal-slate"
                    }`}
                  >
                    <span className="tag-dot" />
                    {s.status}
                  </span>
                  <span className="text-bone">{s.challengeId?.title}</span>
                  <span className="mono-amount text-signal-gold text-right">
                    {s.challengeId?.reward} XLM
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-10 border border-ink-line rounded-sm p-6">
            <h2 className="text-sm font-mono text-bone-dim uppercase tracking-tagwide mb-6">Earnings Growth</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Jan', earnings: 0 },
                  { name: 'Feb', earnings: 50 },
                  { name: 'Mar', earnings: 120 },
                  { name: 'Apr', earnings: 250 },
                  { name: 'May', earnings: user.totalRewards || 400 },
                ]}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val} XLM`} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#2a2a2a', color: '#eaeaea' }} />
                  <Area type="monotone" dataKey="earnings" stroke="#facc15" fillOpacity={1} fill="url(#colorEarnings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
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
