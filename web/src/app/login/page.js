"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-2xl font-medium mb-1">Log in</h1>
      <p className="text-bone-dim text-sm mb-8">Pick up where you left off.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="block text-xs font-mono text-bone-faint uppercase tracking-tagwide mb-2">
            Email
          </span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-ink-raised border border-ink-line rounded-sm px-3 py-2.5 text-sm focus:border-signal-gold focus:outline-none"
            placeholder="you@college.edu"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-mono text-bone-faint uppercase tracking-tagwide mb-2">
            Password
          </span>
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-ink-raised border border-ink-line rounded-sm px-3 py-2.5 text-sm focus:border-signal-gold focus:outline-none"
            placeholder="••••••••"
          />
        </label>

        {error && <p className="text-signal-rust text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-signal-gold text-ink py-2.5 rounded-sm font-medium text-sm hover:bg-signal-gold/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>

      <p className="text-bone-faint text-sm mt-6 text-center">
        New to SkillPay?{" "}
        <a href="/signup" className="text-signal-gold hover:underline">
          Create an account
        </a>
      </p>
    </div>
  );
}
