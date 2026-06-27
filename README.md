# SkillPay — Learn & Earn on Stellar (Level 5 - Blue Belt Submission)

A production-ready blockchain-powered Learn & Earn platform built on the Stellar network. Mentors post challenges and escrow rewards via Freighter wallet. Learners submit real projects (GitHub + live demo). The moment a mentor approves a submission, the payment settles straight to the learner's wallet — no manual payout step.

## 🚀 Live Links
- **Live MVP (Frontend):** [Insert Vercel Link]
- **Backend API:** [Insert Render Link]
- **Pitch Deck:** [View Pitch Deck](pitch_deck.md)
- **Video Demo:** [Insert Video Link]
- **Platform Escrow / Contract Address (Testnet):** `GBCPCCSQGQ33Q65GIDG43KOKWG2HKP7QGDLMDGRVLWMGJYVTBKKV3RDE`

---

## 📈 Level 5 User Growth & Traction

To validate SkillPay with real users, we launched a Beta phase targeting testnet users.
- **Goal:** 50+ Testnet Users onboarded.
- **Achievement:** Reached 50 active learners who interacted with challenges.

### User Feedback & Registration
We created a Google Form to capture user registrations, wallet addresses, and product feedback.
- **[Google Form Link for Registration](Insert Google Form Link Here)**
- **[Download Exported Excel/CSV Form Responses](user_feedback_responses.csv)**

<details>
<summary><b>View JSON Proof of Early Transactions (Level 4 Users)</b></summary>

[View JSON Proof of Transactions](users_transations.json)
</details>

---

## 💬 User Feedback Iteration (Level 5 Improvements)

Based on the feedback collected from the Google Form responses (see CSV above), we planned and executed several major Product Iterations to improve User Experience and Onboarding.

| User Feedback | Our Solution (Level 5 Feature) | Git Commit Proof |
|---|---|---|
| *"Needs better onboarding for beginners."* | **Interactive User Onboarding:** Added a `react-joyride` guided tour that walks new users through the platform seamlessly. | [Commit Link] |
| *"Dashboard analytics would be great."* | **Visual Analytics:** Integrated `recharts` to display visual "Earnings Growth" and "Engagement Overview" graphs on the dashboards. | [Commit Link] |
| *"I don't know when my work gets approved unless I check."* | **In-App Notification Center:** Added a notification bell dropdown using `lucide-react` to keep users updated on challenges and payouts. | [Commit Link] |

*(For earlier feedback iterations from Level 4, see [feedback_summary.md](feedback_summary.md))*

---

## 📸 Screenshots & Evidence

| Landing Page | Open Challenges |
|:---:|:---:|
| ![Landing Page](assets/landing%20page.png) | ![Open Challenges](assets/open%20challenges.png) |

*(Add screenshots of the new Analytics and Onboarding Tour here!)*

---

## 🛠 Tech Stack
- **Frontend:** Next.js (App Router), Tailwind CSS, React, Recharts, React-Joyride
- **Backend:** Node.js, Express, MongoDB Atlas
- **Blockchain:** Stellar SDK (`@stellar/stellar-sdk`), Freighter API (`@stellar/freighter-api`)

---

## 🏃‍♂️ Running Locally

1. **Backend**
```bash
cd server
npm install
npm run dev
```

2. **Frontend**
```bash
cd web
npm install
npm run dev
```
