import {
  Keypair,
  Horizon,
  Networks,
  TransactionBuilder,
  rpc,
  Contract,
  nativeToScVal,
  scValToNative,
  Address,
  BASE_FEE,
} from "@stellar/stellar-sdk";

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = process.env.STELLAR_FRIENDBOT_URL || "https://friendbot.stellar.org";
const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const CONTRACT_ID = process.env.SKILLPAY_CONTRACT_ID;
const NETWORK_PASSPHRASE = Networks.TESTNET;

const horizon = new Horizon.Server(HORIZON_URL);
const sorobanServer = new rpc.Server(SOROBAN_RPC_URL);

/**
 * Generates a brand-new Stellar keypair for a signing-up user and funds it
 * via Friendbot (testnet only — this faucet does not exist on mainnet).
 * Returns the public key + secret. The secret is shown to the user once;
 * in production you would never store it server-side in plaintext.
 */
export async function createFundedWallet() {
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  const secretKey = keypair.secret();

  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Friendbot funding failed: ${text}`);
  }

  return { publicKey, secretKey };
}

/** Fetches XLM balance for a public key from Horizon. */
export async function getBalance(publicKey) {
  try {
    const account = await horizon.loadAccount(publicKey);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native ? native.balance : "0";
  } catch (err) {
    if (err?.response?.status === 404) return "0";
    throw err;
  }
}

/**
 * Invokes a SkillPay contract method that requires the platform/mentor
 * signing key (used until client-side wallet signing, e.g. Freighter, is
 * wired into the frontend). Returns the transaction hash on success.
 */
export async function invokeContract(method, args, signerSecret) {
  if (!CONTRACT_ID) throw new Error("SKILLPAY_CONTRACT_ID is not set");

  const signerKeypair = Keypair.fromSecret(signerSecret);
  const sourceAccount = await sorobanServer.getAccount(signerKeypair.publicKey());
  const contract = new Contract(CONTRACT_ID);

  let tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const prepared = await sorobanServer.prepareTransaction(tx);
  prepared.sign(signerKeypair);

  const sendResponse = await sorobanServer.sendTransaction(prepared);
  if (sendResponse.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${JSON.stringify(sendResponse.errorResult)}`);
  }

  let getResponse = await sorobanServer.getTransaction(sendResponse.hash);
  let attempts = 0;
  while (getResponse.status === "NOT_FOUND" && attempts < 15) {
    await new Promise((r) => setTimeout(r, 1500));
    getResponse = await sorobanServer.getTransaction(sendResponse.hash);
    attempts += 1;
  }

  if (getResponse.status !== "SUCCESS") {
    throw new Error(`Transaction did not succeed: ${getResponse.status}`);
  }

  return {
    hash: sendResponse.hash,
    returnValue: getResponse.returnValue ? scValToNative(getResponse.returnValue) : null,
  };
}

export function addressScVal(publicKey) {
  return new Address(publicKey).toScVal();
}

export function stringScVal(value) {
  return nativeToScVal(value, { type: "string" });
}

export function i128ScVal(value) {
  return nativeToScVal(value, { type: "i128" });
}

export function u64ScVal(value) {
  return nativeToScVal(value, { type: "u64" });
}

export { horizon, sorobanServer, NETWORK_PASSPHRASE };
