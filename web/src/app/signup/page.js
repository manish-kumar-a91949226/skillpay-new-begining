"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { track } from "../../lib/analytics";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "learner" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await signup(form);
      track("wallet_connected", { role: user.role });
      setCreatedUser(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (createdUser) {
    return (
      <div className="max-w-md mx-auto px-6 py-20">
        <span className="tag text-signal-gold border-signal-gold mb-6">
          <span className="tag-dot" />
          wallet funded
        </span>
        <h1 className="text-2xl font-medium mb-2">You're in, {createdUser.name}.</h1>
        <p className="text-bone-dim text-sm mb-8 leading-relaxed">
          We generated a Stellar testnet wallet and funded it with test XLM
          via Friendbot. This is your account's signing address — it's how
          you'll receive rewards.
        </p>

        <div className="ledger">
          <div className="ledger-row grid-cols-[100px_1fr]">
            <span className="text-bone-faint text-xs font-mono uppercase tracking-tagwide">Address</span>
            <span className="mono-amount text-sm break-all">{createdUser.walletAddress}</span>
          </div>
          <div className="ledger-row grid-cols-[100px_1fr]">
            <span className="text-bone-faint text-xs font-mono uppercase tracking-tagwide">Role</span>
            <span className="text-sm capitalize">{createdUser.role}</span>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-8 w-full bg-signal-gold text-ink py-2.5 rounded-sm font-medium text-sm hover:bg-signal-gold/90 transition-colors"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-2xl font-medium mb-1">Open an account</h1>
      <p className="text-bone-dim text-sm mb-8">
        A Stellar wallet is created and funded for you automatically.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Name">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="field-input"
            placeholder="Anika Rao"
          />
        </Field>

        <Field label="Email">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="field-input"
            placeholder="you@college.edu"
          />
        </Field>

        <Field label="Password">
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="field-input"
            placeholder="At least 8 characters"
          />
        </Field>

        <Field label="I am a">
          <div className="flex gap-2">
            {["learner", "mentor"].map((role) => (
              <button
                type="button"
                key={role}
                onClick={() => setForm({ ...form, role })}
                className={`flex-1 py-2 rounded-sm text-sm font-mono capitalize border transition-colors ${
                  form.role === role
                    ? "border-signal-gold text-signal-gold"
                    : "border-ink-line text-bone-dim hover:border-bone-faint"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </Field>

        {error && <p className="text-signal-rust text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-signal-gold text-ink py-2.5 rounded-sm font-medium text-sm hover:bg-signal-gold/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Funding wallet…" : "Create account"}
        </button>
      </form>

      <p className="text-bone-faint text-sm mt-6 text-center">
        Already have an account?{" "}
        <a href="/login" className="text-signal-gold hover:underline">
          Log in
        </a>
      </p>

      <style jsx>{`
        .field-input {
          width: 100%;
          background: var(--ink-raised);
          border: 1px solid var(--ink-line);
          border-radius: 3px;
          padding: 0.6rem 0.75rem;
          color: var(--bone);
          font-size: 0.9rem;
        }
        .field-input:focus {
          outline: 1px solid var(--gold);
          outline-offset: 0;
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
