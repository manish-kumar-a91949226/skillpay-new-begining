//! SkillPay Reward Contract
//!
//! Escrows a reward pool per challenge and releases payment to a learner's
//! wallet when a mentor approves their submission. Built for Stellar Testnet
//! using Soroban.
//!
//! Flow:
//!   1. Mentor calls `create_challenge` -> challenge record stored, status = Open
//!   2. Mentor calls `fund_reward_pool` -> transfers `reward_amount` of the
//!      configured token (e.g. native XLM via the SAC) from the mentor's
//!      wallet into this contract's balance, status -> Funded
//!   3. Off-chain: learner submits project, mentor reviews in the app
//!   4. Mentor calls `release_reward` with the learner's address -> contract
//!      transfers the escrowed amount from itself to the learner, status -> Paid
//!
//! Only the mentor who created a challenge may fund or release it. A
//! challenge can only be paid out once (no double-spend of the pool).

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String, Symbol,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ChallengeStatus {
    Open,   // created, not yet funded
    Funded, // reward pool escrowed in contract
    Paid,   // reward released to a learner
    Closed, // mentor cancelled before funding
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Challenge {
    pub id: u64,
    pub mentor: Address,
    pub title: String,
    pub reward_amount: i128,
    pub token: Address, // SAC contract address for the asset used (e.g. native XLM)
    pub status: ChallengeStatus,
    pub learner: Option<Address>, // set once paid
}

#[contracttype]
pub enum DataKey {
    Challenge(u64),
    NextId,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum ContractError {
    NotMentor = 1,
    ChallengeNotFound = 2,
    AlreadyFunded = 3,
    NotFunded = 4,
    AlreadyPaid = 5,
    InvalidAmount = 6,
    NotOpen = 7,
}

const CHALLENGE_TTL_LEDGERS: u32 = 535_679; // ~30 days, extend on touch
const BUMP_THRESHOLD: u32 = 100_000;

#[contract]
pub struct SkillPayContract;

#[contractimpl]
impl SkillPayContract {
    /// Mentor creates a new challenge listing. No funds move here.
    /// `token` is the SAC contract address of the asset the reward is paid in
    /// (use the native XLM SAC address on testnet).
    pub fn create_challenge(
        env: Env,
        mentor: Address,
        title: String,
        reward_amount: i128,
        token: Address,
    ) -> Result<u64, ContractError> {
        mentor.require_auth();

        if reward_amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let next_id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);

        let challenge = Challenge {
            id: next_id,
            mentor: mentor.clone(),
            title,
            reward_amount,
            token,
            status: ChallengeStatus::Open,
            learner: None,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Challenge(next_id), &challenge);
        env.storage().persistent().extend_ttl(
            &DataKey::Challenge(next_id),
            BUMP_THRESHOLD,
            CHALLENGE_TTL_LEDGERS,
        );

        env.storage()
            .instance()
            .set(&DataKey::NextId, &(next_id + 1));

        env.events().publish(
            (Symbol::new(&env, "challenge_created"), mentor),
            (next_id, reward_amount),
        );

        Ok(next_id)
    }

    /// Mentor escrows the reward into this contract. Requires the mentor to
    /// have approved this contract to spend `reward_amount` of `token`
    /// beforehand (standard SAC `approve` flow), or simply require_auth on a
    /// direct transfer invocation from the mentor's signed transaction.
    pub fn fund_reward_pool(
        env: Env,
        mentor: Address,
        challenge_id: u64,
    ) -> Result<(), ContractError> {
        mentor.require_auth();

        let mut challenge: Challenge = env
            .storage()
            .persistent()
            .get(&DataKey::Challenge(challenge_id))
            .ok_or(ContractError::ChallengeNotFound)?;

        if challenge.mentor != mentor {
            return Err(ContractError::NotMentor);
        }
        if challenge.status != ChallengeStatus::Open {
            return Err(ContractError::AlreadyFunded);
        }

        let token_client = token::Client::new(&env, &challenge.token);
        token_client.transfer(
            &mentor,
            &env.current_contract_address(),
            &challenge.reward_amount,
        );

        challenge.status = ChallengeStatus::Funded;
        env.storage()
            .persistent()
            .set(&DataKey::Challenge(challenge_id), &challenge);

        env.events().publish(
            (Symbol::new(&env, "reward_funded"), mentor),
            (challenge_id, challenge.reward_amount),
        );

        Ok(())
    }

    /// Mentor approves a learner's submission; contract pays the learner
    /// directly from escrow. Can only happen once per challenge.
    pub fn release_reward(
        env: Env,
        mentor: Address,
        challenge_id: u64,
        learner: Address,
    ) -> Result<(), ContractError> {
        mentor.require_auth();

        let mut challenge: Challenge = env
            .storage()
            .persistent()
            .get(&DataKey::Challenge(challenge_id))
            .ok_or(ContractError::ChallengeNotFound)?;

        if challenge.mentor != mentor {
            return Err(ContractError::NotMentor);
        }
        match challenge.status {
            ChallengeStatus::Funded => {}
            ChallengeStatus::Paid => return Err(ContractError::AlreadyPaid),
            _ => return Err(ContractError::NotFunded),
        }

        let token_client = token::Client::new(&env, &challenge.token);
        token_client.transfer(
            &env.current_contract_address(),
            &learner,
            &challenge.reward_amount,
        );

        challenge.status = ChallengeStatus::Paid;
        challenge.learner = Some(learner.clone());
        env.storage()
            .persistent()
            .set(&DataKey::Challenge(challenge_id), &challenge);

        env.events().publish(
            (Symbol::new(&env, "reward_released"), mentor),
            (challenge_id, learner, challenge.reward_amount),
        );

        Ok(())
    }

    /// Read-only lookup, used by the backend to display challenge + escrow
    /// state and to verify on-chain status before/after mentor actions.
    pub fn get_challenge(env: Env, challenge_id: u64) -> Result<Challenge, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Challenge(challenge_id))
            .ok_or(ContractError::ChallengeNotFound)
    }

    /// Mentor can cancel an unfunded challenge (cleanup / listing removed).
    pub fn close_challenge(
        env: Env,
        mentor: Address,
        challenge_id: u64,
    ) -> Result<(), ContractError> {
        mentor.require_auth();

        let mut challenge: Challenge = env
            .storage()
            .persistent()
            .get(&DataKey::Challenge(challenge_id))
            .ok_or(ContractError::ChallengeNotFound)?;

        if challenge.mentor != mentor {
            return Err(ContractError::NotMentor);
        }
        if challenge.status != ChallengeStatus::Open {
            return Err(ContractError::NotOpen);
        }

        challenge.status = ChallengeStatus::Closed;
        env.storage()
            .persistent()
            .set(&DataKey::Challenge(challenge_id), &challenge);

        Ok(())
    }
}

mod test;
