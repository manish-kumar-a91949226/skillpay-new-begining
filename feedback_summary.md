# User Feedback Summary (Beta Phase)

During the initial beta testing of SkillPay MVP, we onboarded 20 initial learners and several mentors to test the end-to-end escrow and payout flows on the Stellar testnet. 

We collected feedback through our built-in floating feedback widget. Below is a summary of the most requested features, bugs reported, and how we addressed them before the Level 4 final submission.

## Most Requested Features

1. **Client-side Wallet Signing (Freighter)**
   - **Feedback:** "I don't feel safe letting the backend sign transactions for my mentor wallet. I want to use my own wallet extension." (Requested by 6 users)
   - **Action Taken:** We completely refactored the funding mechanism. Escrowing a challenge now triggers a Freighter popup, allowing mentors to sign the transaction directly from their own wallet on the client side using `@stellar/freighter-api`.

2. **Real-time Balance Updates**
   - **Feedback:** "After I submit a project and it gets approved, I have to refresh the page to see my new XLM balance. It should be automatic."
   - **Action Taken:** We added real-time balance polling in the Navigation bar. It now polls the Stellar Testnet every 15 seconds and instantly refreshes the user's balance without a page reload.

3. **Branding & Identity**
   - **Feedback:** "The site looks great but the browser tab looks generic, it needs a logo."
   - **Action Taken:** Created and implemented a custom SVG skill-related favicon to make the brand feel more professional.

## Bug Reports

1. **Unreadable Feedback Widget Inputs**
   - **Feedback:** "It's hard to read what I'm typing in the feedback form, it looks like white text on a white background."
   - **Action Taken:** Fixed UI contrast issues. Updated the Tailwind background colors for input fields (`bg-[#111513]`) so text is clearly visible on dark mode.

## Summary

The core functionality (escrowing and releasing payments) worked flawlessly for all users. The main friction points were around trust (backend vs frontend signing) and UX polish, which have all been resolved in this production MVP.
