import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Challenge from "../models/Challenge.js";
import { createFundedWallet } from "../config/stellar.js";

async function seed() {
  await connectDB();

  const email = "mentor@skillpay.dev";
  let mentor = await User.findOne({ email });

  if (!mentor) {
    console.log("Creating + funding a testnet wallet for the demo mentor (this calls Friendbot)...");
    const { publicKey, secretKey } = await createFundedWallet();
    const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
    mentor = await User.create({
      name: "Demo Mentor",
      email,
      password: passwordHash,
      role: "mentor",
      walletAddress: publicKey,
      walletSecret: secretKey,
    });
    console.log("Seeded demo mentor:", email, "/ ChangeMe123!");
    console.log("Mentor wallet:", publicKey);
  } else {
    console.log("Seed mentor already exists, checking for challenges...");
  }

  // Count existing challenges to avoid duplicates
  const existingCount = await Challenge.countDocuments({ mentor: mentor._id });
  if (existingCount >= 8) {
    console.log("Challenges already seeded, skipping.");
    process.exit(0);
  }

  const now = Date.now();
  const week = 1000 * 60 * 60 * 24 * 7;
  const seedChallenges = [
    {
      title: "Build a Personal Portfolio Website",
      description:
        "Create a fully responsive personal portfolio website and deploy it live. Include an about section, project showcase, and contact form. Use any modern framework (React, Vue, Next.js etc.).",
      reward: 50,
      deadline: new Date(now + 3 * week),
      difficulty: "beginner",
    },
    {
      title: "Build a Real-Time Chat App",
      description:
        "Build a real-time chat application using WebSockets (Socket.io or similar). Users should be able to create rooms and send messages. Deploy it and provide a live link.",
      reward: 120,
      deadline: new Date(now + 4 * week),
      difficulty: "intermediate",
    },
    {
      title: "Smart Contract Audit Challenge",
      description:
        "Review the provided Soroban smart contract (linked in the repo) and produce a written security audit report. Identify potential vulnerabilities, logic flaws, and suggest improvements.",
      reward: 200,
      deadline: new Date(now + 5 * week),
      difficulty: "advanced",
    },
    {
      title: "Create a REST API with Authentication",
      description:
        "Build a production-ready REST API with JWT authentication, user registration/login, and CRUD operations for a resource of your choice. Include Swagger/OpenAPI documentation.",
      reward: 80,
      deadline: new Date(now + 3 * week),
      difficulty: "intermediate",
    },
    {
      title: "Stellar Wallet Integration",
      description:
        "Integrate the Freighter wallet extension into a simple web app. The app should allow users to connect their wallet, view their XLM balance, and send a test transaction on the Stellar Testnet.",
      reward: 150,
      deadline: new Date(now + 4 * week),
      difficulty: "intermediate",
    },
    {
      title: "Beginner: CSS Animation Showcase",
      description:
        "Create a webpage showcasing 5 creative CSS animations. No JavaScript allowed for the animations themselves — pure CSS only. Include transitions, keyframes, and transforms.",
      reward: 30,
      deadline: new Date(now + 2 * week),
      difficulty: "beginner",
    },
    {
      title: "Build a DeFi Dashboard Clone",
      description:
        "Clone the UI/UX of a popular DeFi dashboard (e.g., Uniswap, Aave) and connect it to Stellar Testnet data via Horizon API. Display live token prices, account balances, and recent transactions.",
      reward: 300,
      deadline: new Date(now + 6 * week),
      difficulty: "advanced",
    },
    {
      title: "Mobile-First Landing Page",
      description:
        "Design and build a stunning, mobile-first landing page for a fictional SaaS product. Should include a hero section, features grid, pricing table, and a CTA. Score points for animations!",
      reward: 40,
      deadline: new Date(now + 2 * week),
      difficulty: "beginner",
    },
  ];

  for (const c of seedChallenges) {
    await Challenge.create({ ...c, mentor: mentor._id });
    console.log(`Created challenge: ${c.title}`);
  }

  console.log(`\nDone! Seeded ${seedChallenges.length} challenges.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
