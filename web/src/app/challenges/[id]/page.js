"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../lib/auth";
import { api } from "../../../lib/api";
import { track } from "../../../lib/analytics";
import { getBalance, fundChallengeFromWallet } from "../../../lib/stellar";

export default function ChallengeDetailPage() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(null);

  const refreshBalance = useCallback(async () => {
    if (user?.walletAddress) {
      try {
        const bal = await getBalance(user.walletAddress);
        setBalance(parseFloat(bal).toFixed(2));
      } catch { /* silent */ }
    }
  }, [user?.walletAddress]);

  useEffect(() => {
    api
      .getChallenge(id)
      .then(({ challenge }) => setChallenge(challenge))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    track("challenge_viewed", { challengeId: id });
    refreshBalance();
  }, [id, refreshBalance]);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-6 py-20 text-bone-faint">Loading challenge…</div>;
  }

  if (error || !challenge) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-signal-rust text-sm">Couldn't load this challenge — {error}</p>
      </div>
    );
  }

  const isOwnerMentor = user?.role === "mentor" && user?.id === challenge.mentor?._id;

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      {balance !== null && (
        <div className="mb-4 text-xs font-mono text-bone-faint flex items-center gap-2">
          <span className="text-signal-slate">●</span>
          Wallet balance: <span className="text-signal-gold font-medium">{balance} XLM</span>
        </div>
      )}
      <span className="tag text-signal-slate border-signal-slate mb-4">
        <span className="tag-dot" />
        {challenge.status}
      </span>

      <h1 className="text-3xl font-medium mb-3">{challenge.title}</h1>
      <p className="text-bone-dim leading-relaxed mb-8">{challenge.description}</p>

      <div className="ledger mb-10">
        <DetailRow label="Reward" value={`${challenge.reward} XLM`} highlight />
        <DetailRow label="Deadline" value={new Date(challenge.deadline).toLocaleDateString()} />
        <DetailRow label="Difficulty" value={challenge.difficulty} />
        <DetailRow label="Posted by" value={challenge.mentor?.name} />
        <DetailRow
          label="Escrow"
          value={
            challenge.contractStatus === "unfunded"
              ? "not yet funded on-chain"
              : (
                <span>
                  funded ·{" "}
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${challenge.fundingTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-signal-slate hover:underline"
                  >
                    tx {challenge.fundingTxHash?.slice(0, 10)}… ↗
                  </a>
                </span>
              )
          }
        />
      </div>

      {isOwnerMentor && challenge.contractStatus === "unfunded" && (
        <FundButton
          challenge={challenge}
          onFunded={(updated) => { setChallenge(updated); refreshBalance(); }}
          onBalanceRefresh={refreshBalance}
        />
      )}

      {isOwnerMentor && (
        <MentorReview challenge={challenge} />
      )}

      {!isOwnerMentor && user?.role === "learner" && (
        <SubmissionForm challenge={challenge} />
      )}

      {!user && (
        <p className="text-bone-faint text-sm border border-ink-line rounded-sm p-4">
          <a href="/login" className="text-signal-gold hover:underline">
            Log in
          </a>{" "}
          as a learner to submit your work for this challenge.
        </p>
      )}
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="ledger-row grid-cols-[140px_1fr]">
      <span className="text-bone-faint text-xs font-mono uppercase tracking-tagwide">{label}</span>
      <span className={`text-sm ${highlight ? "mono-amount text-signal-gold text-base" : "text-bone"}`}>
        {value}
      </span>
    </div>
  );
}

function FundButton({ challenge, onFunded, onBalanceRefresh }) {
  const [step, setStep] = useState("idle"); // idle | connecting | signing | submitting | done
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [error, setError] = useState("");

  async function handleFund() {
    setError("");
    setStep("signing");
    try {
      // 1. Sign and submit XLM payment from user's Freighter wallet
      const { txHash, walletAddress: addr } = await fundChallengeFromWallet(
        challenge.reward,
        challenge.title
      );
      setWalletAddress(addr);
      setStep("submitting");

      // 2. Tell backend to mark challenge as funded with the real txHash
      const { challenge: updatedChallenge } = await api.fundChallenge(challenge._id, { txHash });
      onFunded(updatedChallenge);
      setStep("done");

      // 3. Refresh balance in navbar
      if (onBalanceRefresh) onBalanceRefresh();
    } catch (err) {
      setError(err.message);
      setStep("idle");
    }
  }

  const isLoading = step === "signing" || step === "submitting";
  const stepLabel = {
    idle: "Fund reward pool via Freighter",
    signing: "Sign in Freighter wallet…",
    submitting: "Submitting to Stellar…",
    done: "Funded!",
  };

  return (
    <div className="border border-signal-gold/40 rounded-sm p-5 mb-10 space-y-3">
      <p className="text-sm text-bone-dim">
        Escrow the reward on-chain from your own wallet. This sends{" "}
        <span className="text-signal-gold font-mono font-medium">{challenge.reward} XLM</span>{" "}
        to the SkillPay escrow address — verifiable on Stellar Explorer.
      </p>

      <div className="flex items-center gap-2 text-xs font-mono text-bone-faint">
        <span className="w-1.5 h-1.5 rounded-full bg-signal-slate inline-block" />
        Uses Freighter Wallet Extension
      </div>

      {error && (
        <div className="bg-signal-rust/10 border border-signal-rust/40 rounded-sm p-3">
          <p className="text-signal-rust text-xs">{error}</p>
          {error.includes("Freighter") && (
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noreferrer"
              className="text-signal-slate text-xs hover:underline mt-1 block"
            >
              Install Freighter ↗
            </a>
          )}
          {error.includes("activated") && (
            <a
              href="https://laboratory.stellar.org/#account-creator?network=test"
              target="_blank"
              rel="noreferrer"
              className="text-signal-slate text-xs hover:underline mt-1 block"
            >
              Activate on Testnet ↗
            </a>
          )}
        </div>
      )}

      <button
        onClick={handleFund}
        disabled={isLoading}
        className="bg-signal-gold text-ink px-4 py-2 rounded-sm text-sm font-medium hover:bg-signal-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {isLoading && (
          <span className="w-3 h-3 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
        )}
        {stepLabel[step]}
      </button>
    </div>
  );
}

function SubmissionForm({ challenge }) {
  const [form, setForm] = useState({ githubLink: "", demoLink: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.submitProject({ challengeId: challenge._id, ...form });
      track("submission_made", { challengeId: challenge._id });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="border border-signal-slate/40 rounded-sm p-5">
        <p className="text-signal-slate text-sm">
          Submitted. The mentor will review it and approve or send it back —
          you'll see the status update on your dashboard.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-ink-line rounded-sm p-5">
      <h3 className="text-sm font-mono text-bone-dim uppercase tracking-tagwide">Submit your work</h3>

      <input
        required
        value={form.githubLink}
        onChange={(e) => setForm({ ...form, githubLink: e.target.value })}
        placeholder="GitHub repo link"
        className="w-full bg-ink-raised border border-ink-line rounded-sm px-3 py-2.5 text-sm focus:border-signal-gold focus:outline-none"
      />
      <input
        value={form.demoLink}
        onChange={(e) => setForm({ ...form, demoLink: e.target.value })}
        placeholder="Live demo link (optional)"
        className="w-full bg-ink-raised border border-ink-line rounded-sm px-3 py-2.5 text-sm focus:border-signal-gold focus:outline-none"
      />
      <textarea
        rows={3}
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Anything the mentor should know"
        className="w-full bg-ink-raised border border-ink-line rounded-sm px-3 py-2.5 text-sm resize-none focus:border-signal-gold focus:outline-none"
      />

      {error && <p className="text-signal-rust text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-signal-gold text-ink px-4 py-2 rounded-sm text-sm font-medium hover:bg-signal-gold/90 transition-colors disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}

function MentorReview({ challenge }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .challengeSubmissions(challenge._id)
      .then(({ submissions }) => setSubmissions(submissions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [challenge._id]);

  async function handleApprove(submissionId) {
    setActioningId(submissionId);
    setError("");
    try {
      const { submission } = await api.approveSubmission(submissionId);
      track("reward_claimed", { challengeId: challenge._id, submissionId });
      setSubmissions((prev) => prev.map((s) => (s._id === submissionId ? submission : s)));
    } catch (err) {
      setError(err.message);
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(submissionId) {
    setActioningId(submissionId);
    setError("");
    try {
      const { submission } = await api.rejectSubmission(submissionId);
      setSubmissions((prev) => prev.map((s) => (s._id === submissionId ? submission : s)));
    } catch (err) {
      setError(err.message);
    } finally {
      setActioningId(null);
    }
  }

  if (loading) return <p className="text-bone-faint text-sm">Loading submissions…</p>;

  return (
    <div className="mt-10">
      <h3 className="text-sm font-mono text-bone-dim uppercase tracking-tagwide mb-4">
        Submissions ({submissions.length})
      </h3>

      {error && <p className="text-signal-rust text-sm mb-3">{error}</p>}

      {submissions.length === 0 && (
        <p className="text-bone-faint text-sm">No submissions yet.</p>
      )}

      <div className="space-y-4">
        {submissions.map((s) => (
          <div key={s._id} className="border border-ink-line rounded-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{s.userId?.name}</span>
              <span
                className={`tag text-xs ${
                  s.status === "approved"
                    ? "text-signal-gold border-signal-gold"
                    : s.status === "rejected"
                    ? "text-signal-rust border-signal-rust"
                    : "text-signal-slate border-signal-slate"
                }`}
              >
                {s.status}
              </span>
            </div>
            <a
              href={s.githubLink}
              target="_blank"
              rel="noreferrer"
              className="text-signal-slate text-sm hover:underline block mb-1"
            >
              {s.githubLink}
            </a>
            {s.demoLink && (
              <a
                href={s.demoLink}
                target="_blank"
                rel="noreferrer"
                className="text-signal-slate text-sm hover:underline block mb-1"
              >
                {s.demoLink}
              </a>
            )}
            {s.notes && <p className="text-bone-dim text-sm mt-2">{s.notes}</p>}

            {s.aiReview && (
              <div className="mt-3 border-t border-ink-line pt-3 text-sm text-bone-dim">
                <p className="font-mono text-xs text-bone-faint uppercase tracking-tagwide mb-1">
                  AI review
                </p>
                <p>{s.aiReview.summary}</p>
                <p className="mt-1 font-mono text-xs">
                  Code {s.aiReview.codeQualityScore}/10 · Docs {s.aiReview.documentationScore}/10 ·
                  Innovation {s.aiReview.innovationScore}/10
                </p>
              </div>
            )}

            {s.status === "pending" && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleApprove(s._id)}
                  disabled={actioningId === s._id}
                  className="bg-signal-gold text-ink px-3 py-1.5 rounded-sm text-xs font-medium hover:bg-signal-gold/90 transition-colors disabled:opacity-50"
                >
                  {actioningId === s._id ? "Releasing…" : "Approve & pay"}
                </button>
                <button
                  onClick={() => handleReject(s._id)}
                  disabled={actioningId === s._id}
                  className="border border-ink-line text-bone-dim px-3 py-1.5 rounded-sm text-xs hover:border-signal-rust hover:text-signal-rust transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
