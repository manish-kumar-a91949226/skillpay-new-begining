import "../styles/globals.css";
import { AuthProvider } from "../lib/auth";
import AnalyticsInit from "../components/AnalyticsInit";
import { Analytics } from "@vercel/analytics/react";
import NavBar from "../components/NavBar";
import FeedbackWidget from "../components/FeedbackWidget";
import OnboardingTour from "../components/OnboardingTour";

export const metadata = {
  title: "SkillPay — Learn. Prove it. Get paid.",
  description: "A ledger of skill, proof, and payment — built on Stellar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-ink text-bone">
        <AuthProvider>
          <AnalyticsInit />
          <NavBar />
          <OnboardingTour />
          <main>{children}</main>
          <FeedbackWidget />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
