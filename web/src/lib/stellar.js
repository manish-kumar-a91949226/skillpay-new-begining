import {
  Networks,
  TransactionBuilder,
  Horizon,
  Operation,
  Asset,
  Memo,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

// Platform escrow address — when user funds, XLM goes here as escrow proof
// In production this would be the deployed Soroban contract address
const PLATFORM_ESCROW = "GBCPCCSQGQ33Q65GIDG43KOKWG2HKP7QGDLMDGRVLWMGJYVTBKKV3RDE";

const horizon = new Horizon.Server(HORIZON_URL);

/** Fetch XLM balance for any Stellar public key via Horizon */
export async function getBalance(publicKey) {
  try {
    const account = await horizon.loadAccount(publicKey);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native ? native.balance : "0";
  } catch {
    return "0";
  }
}

/** Connect Freighter wallet using the v6 API. Returns the user's public key. */
export async function connectFreighter() {
  if (typeof window === "undefined") {
    throw new Error("Cannot connect wallet server-side");
  }

  // 1. Check if Freighter extension is installed and running
  const connectedResult = await isConnected();
  if (connectedResult.error) {
    throw new Error("Freighter error: " + connectedResult.error);
  }
  if (!connectedResult.isConnected) {
    throw new Error(
      "Freighter wallet not found. Please install the Freighter browser extension from freighter.app and reload this page."
    );
  }

  // 2. Check if this site is allowed to access Freighter
  const allowedResult = await isAllowed();
  if (!allowedResult.isAllowed) {
    const setResult = await setAllowed();
    if (setResult.error) {
      throw new Error("Could not enable Freighter access: " + setResult.error);
    }
  }

  // 3. Get the connected wallet address
  let addressResult = await getAddress();
  if (addressResult.error || !addressResult.address) {
    // Not connected yet — ask for access
    const accessResult = await requestAccess();
    if (accessResult.error || !accessResult.address) {
      throw new Error(
        "Wallet access denied. Please approve the connection in Freighter and try again."
      );
    }
    return accessResult.address;
  }

  return addressResult.address;
}

/**
 * Fund a challenge from the user's Freighter wallet.
 * Sends rewardAmount XLM to the SkillPay escrow address,
 * signed by the user's Freighter wallet.
 * Returns { txHash, walletAddress }.
 */
export async function fundChallengeFromWallet(rewardAmount, challengeTitle) {
  // Step 1: Connect wallet
  const publicKey = await connectFreighter();

  // Step 2: Check user is on Testnet
  const { getNetworkDetails } = await import("@stellar/freighter-api");
  try {
    const networkResult = await getNetworkDetails();
    if (networkResult.networkPassphrase !== Networks.TESTNET) {
      throw new Error(
        `Please switch Freighter to the Stellar Testnet. Currently on: ${networkResult.network}`
      );
    }
  } catch (e) {
    if (e.message.includes("switch")) throw e;
    // If getNetworkDetails fails, proceed anyway
  }

  // Step 3: Load account from Horizon
  let account;
  try {
    account = await horizon.loadAccount(publicKey);
  } catch {
    throw new Error(
      "Your Freighter wallet address is not activated on Stellar Testnet. " +
      "Please fund it at https://laboratory.stellar.org/#account-creator?network=test"
    );
  }

  // Step 4: Check sufficient balance
  const native = account.balances.find((b) => b.asset_type === "native");
  const balance = native ? parseFloat(native.balance) : 0;
  if (balance < rewardAmount + 1) {
    throw new Error(
      `Insufficient balance. You have ${balance.toFixed(2)} XLM but need at least ${rewardAmount + 1} XLM ` +
      `(${rewardAmount} for reward + fees). Fund at https://laboratory.stellar.org/#account-creator?network=test`
    );
  }

  // Step 5: Build the XLM payment transaction
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: PLATFORM_ESCROW,
        asset: Asset.native(),
        amount: String(rewardAmount),
      })
    )
    .addMemo(Memo.text(challengeTitle.slice(0, 28))) // Stellar memo max 28 bytes
    .setTimeout(30)
    .build();

  // Step 6: Sign with Freighter wallet
  let signedTxXdr;
  try {
    const signResult = await signTransaction(tx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    if (signResult.error) {
      throw new Error(signResult.error.message || String(signResult.error));
    }
    signedTxXdr = signResult.signedTxXdr;
  } catch (e) {
    if (e.message?.toLowerCase().includes("cancel") || e.message?.toLowerCase().includes("reject")) {
      throw new Error("Transaction was cancelled. Please try again and approve in Freighter.");
    }
    throw new Error("Signing failed: " + (e.message || String(e)));
  }

  if (!signedTxXdr) {
    throw new Error("No signed transaction received from Freighter. Did you reject the popup?");
  }

  // Step 7: Submit to Stellar Testnet via Horizon
  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  let response;
  try {
    response = await horizon.submitTransaction(signedTx);
  } catch (e) {
    const extras = e?.response?.data?.extras;
    const detail =
      extras?.result_codes?.transaction ||
      extras?.result_codes?.operations?.[0] ||
      e.message;
    throw new Error("Transaction submission failed: " + detail);
  }

  return { txHash: response.hash, walletAddress: publicKey };
}
