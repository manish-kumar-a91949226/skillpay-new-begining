import Link from "next/link";
import SettlementTicker from "../components/SettlementTicker";

export default function HomePage() {
  return (
    <div>
      {/* Hero — the thesis */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="flex items-baseline gap-3 mb-6">
          <span className="tag text-signal-slate border-signal-slate">
            <span className="tag-dot" />
            stellar testnet
          </span>
          <span className="text-bone-faint text-xs font-mono">v1.0</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-medium leading-[1.05] tracking-tight max-w-3xl">
          Learn the skill.{" "}
          <span className="text-bone-dim">Ship the proof.</span>{" "}
          <span className="text-signal-gold">Get settled.</span>
        </h1>

        <p className="mt-6 text-bone-dim text-lg max-w-xl leading-relaxed">
          SkillPay is a ledger, not a leaderboard. Mentors post challenges and
          escrow the reward on Stellar. Learners submit real work. The moment
          it's approved, payment settles to their wallet — no invoices, no
          waiting on payroll.
        </p>

        <div className="mt-9 flex items-center gap-4">
          <Link
            href="/signup"
            className="bg-signal-gold text-ink px-5 py-2.5 rounded-sm font-medium text-sm hover:bg-signal-gold/90 transition-colors"
          >
            Create your wallet
          </Link>
          <Link
            href="/challenges"
            className="text-bone-dim text-sm hover:text-bone transition-colors font-mono"
          >
            browse open challenges →
          </Link>
        </div>
      </section>

      {/* Signature element: live settlement ticker */}
      <SettlementTicker />

      {/* How it settles — ledger-row layout, not cards */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-mono text-bone-dim tracking-tagwide uppercase">
            How a reward settles
          </h2>
          <span className="text-xs font-mono text-bone-faint">4 steps · on-chain</span>
        </div>

        <div className="ledger mt-6">
          <Row
            status="open"
            statusColor="text-signal-slate border-signal-slate"
            title="Mentor posts a challenge"
            detail="Title, description, reward amount, and a deadline. Listed instantly for learners to browse."
          />
          <Row
            status="funded"
            statusColor="text-signal-gold border-signal-gold"
            title="Reward pool escrowed"
            detail="The mentor's wallet funds the Soroban contract directly — the reward exists on-chain before anyone submits work."
          />
          <Row
            status="review"
            statusColor="text-signal-slate border-signal-slate"
            title="Learner submits, mentor reviews"
            detail="GitHub link, live demo, and notes. The mentor approves or sends it back."
          />
          <Row
            status="paid"
            statusColor="text-signal-gold border-signal-gold"
            title="Contract releases payment"
            detail="Approval triggers release_reward — XLM lands in the learner's wallet in the same transaction."
            last
          />
        </div>
      </section>

      {/* Closing band */}
      <section className="border-t border-ink-line">
        <div className="max-w-6xl mx-auto px-6 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="text-bone-dim max-w-md">
            Building a public record of what you can actually do — backed by
            transactions, not testimonials.
          </p>
          <Link
            href="/signup"
            className="border border-signal-gold text-signal-gold px-5 py-2.5 rounded-sm text-sm font-mono hover:bg-signal-gold hover:text-ink transition-colors whitespace-nowrap"
          >
            open an account →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Row({ status, statusColor, title, detail, last }) {
  return (
    <div className={`ledger-row grid-cols-[100px_1fr] gap-6 ${last ? "" : ""}`}>
      <div>
        <span className={`tag ${statusColor}`}>
          <span className="tag-dot" />
          {status}
        </span>
      </div>
      <div>
        <h3 className="text-base font-medium text-bone mb-1">{title}</h3>
        <p className="text-sm text-bone-dim leading-relaxed max-w-xl">{detail}</p>
      </div>
    </div>
  );
}
