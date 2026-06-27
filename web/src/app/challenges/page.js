"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { track } from "../../lib/analytics";
import { useAuth } from "../../lib/auth";

const STATUS_STYLE = {
  open: "text-signal-slate border-signal-slate",
  funded: "text-signal-gold border-signal-gold",
  closed: "text-bone-faint border-bone-faint",
};

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getChallenges()
      .then(({ challenges }) => setChallenges(challenges))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    track("challenge_viewed", { context: "listing" });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium">Open challenges</h1>
          <p className="text-bone-dim text-sm mt-1">
            Pick one, ship the work, get paid when it's approved.
          </p>
        </div>
        {user?.role === "mentor" && (
          <Link
            href="/challenges/new"
            className="font-mono text-sm border border-signal-gold text-signal-gold px-4 py-2 rounded-sm hover:bg-signal-gold hover:text-ink transition-colors"
          >
            + new challenge
          </Link>
        )}
      </div>

      {loading && <LoadingRows />}

      {!loading && error && (
        <p className="text-signal-rust text-sm border border-signal-rust/40 rounded-sm p-4">
          Couldn't load challenges — {error}
        </p>
      )}

      {!loading && !error && challenges.length === 0 && (
        <div className="border border-ink-line rounded-sm p-10 text-center">
          <p className="text-bone-dim">No challenges posted yet.</p>
          <p className="text-bone-faint text-sm mt-1">
            {user?.role === "mentor"
              ? "Post the first one — it only takes a minute."
              : "Check back soon, or ask a mentor to post one."}
          </p>
        </div>
      )}

      {!loading && !error && challenges.length > 0 && (
        <div className="ledger">
          {challenges.map((c) => (
            <ChallengeRow key={c._id} challenge={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengeRow({ challenge }) {
  const deadline = new Date(challenge.deadline);
  const deadlineLabel = deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Link
      href={`/challenges/${challenge._id}`}
      className="ledger-row grid-cols-[110px_1fr_140px_100px] gap-6 items-center"
    >
      <span className={`tag ${STATUS_STYLE[challenge.status] || STATUS_STYLE.open}`}>
        <span className="tag-dot" />
        {challenge.status}
      </span>

      <div>
        <h3 className="font-medium text-bone">{challenge.title}</h3>
        <p className="text-bone-faint text-sm mt-0.5">
          {challenge.mentor?.name} · {challenge.difficulty} · due {deadlineLabel}
        </p>
      </div>

      <span className="font-mono text-sm text-bone-dim">
        {challenge.contractStatus === "funded" || challenge.contractStatus === "paid" ? (
          <span className="text-signal-gold">escrowed</span>
        ) : (
          "not yet funded"
        )}
      </span>

      <span className="mono-amount text-signal-gold text-right text-base">
        {challenge.reward} <span className="text-xs text-bone-faint">XLM</span>
      </span>
    </Link>
  );
}

function LoadingRows() {
  return (
    <div className="ledger">
      {[0, 1, 2].map((i) => (
        <div key={i} className="ledger-row grid-cols-[110px_1fr_140px_100px] gap-6 items-center animate-pulse">
          <div className="h-5 w-16 bg-ink-line rounded-sm" />
          <div className="h-5 w-2/3 bg-ink-line rounded-sm" />
          <div className="h-5 w-24 bg-ink-line rounded-sm" />
          <div className="h-5 w-12 bg-ink-line rounded-sm ml-auto" />
        </div>
      ))}
    </div>
  );
}
