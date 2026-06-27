"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth";
import { api } from "../../../lib/api";
import { track } from "../../../lib/analytics";

export default function NewChallengePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    reward: "",
    deadline: "",
    difficulty: "beginner",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user && user.role !== "mentor") {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <p className="text-bone-dim">Only mentor accounts can post challenges.</p>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { challenge } = await api.createChallenge({
        ...form,
        reward: Number(form.reward),
      });
      track("challenge_created", { challengeId: challenge._id, reward: challenge.reward });
      router.push(`/challenges/${challenge._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-14">
      <h1 className="text-2xl font-medium mb-1">Post a challenge</h1>
      <p className="text-bone-dim text-sm mb-8">
        You'll escrow the reward on-chain in a separate step once it's posted.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Title">
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
            placeholder="Build a Personal Portfolio"
          />
        </Field>

        <Field label="Description">
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input resize-none"
            placeholder="What should the learner build, and how will you judge it?"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Reward (XLM)">
            <input
              required
              type="number"
              min="1"
              value={form.reward}
              onChange={(e) => setForm({ ...form, reward: e.target.value })}
              className="input"
              placeholder="50"
            />
          </Field>

          <Field label="Deadline">
            <input
              required
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="input"
            />
          </Field>
        </div>

        <Field label="Difficulty">
          <div className="flex gap-2">
            {["beginner", "intermediate", "advanced"].map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setForm({ ...form, difficulty: d })}
                className={`flex-1 py-2 rounded-sm text-sm font-mono capitalize border transition-colors ${
                  form.difficulty === d
                    ? "border-signal-gold text-signal-gold"
                    : "border-ink-line text-bone-dim hover:border-bone-faint"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>

        {error && <p className="text-signal-rust text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-signal-gold text-ink py-2.5 rounded-sm font-medium text-sm hover:bg-signal-gold/90 transition-colors disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post challenge"}
        </button>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          background: var(--ink-raised);
          border: 1px solid var(--ink-line);
          border-radius: 3px;
          padding: 0.6rem 0.75rem;
          color: var(--bone);
          font-size: 0.9rem;
        }
        .input:focus {
          outline: 1px solid var(--gold);
          border-color: var(--gold);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono text-bone-faint uppercase tracking-tagwide mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
