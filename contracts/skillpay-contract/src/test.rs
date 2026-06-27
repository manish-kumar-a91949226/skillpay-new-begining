#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (Address, token::StellarAssetClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let address = sac.address();
    (
        address.clone(),
        token::StellarAssetClient::new(env, &address),
    )
}

#[test]
fn full_flow_create_fund_release() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SkillPayContract);
    let client = SkillPayContractClient::new(&env, &contract_id);

    let mentor = Address::generate(&env);
    let learner = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_address, token_admin_client) = create_token_contract(&env, &token_admin);
    let token_client = token::Client::new(&env, &token_address);

    // fund mentor's wallet with 1000 units of the test asset
    token_admin_client.mint(&mentor, &1000);
    assert_eq!(token_client.balance(&mentor), 1000);

    // 1. create
    let challenge_id = client.create_challenge(
        &mentor,
        &String::from_str(&env, "Build a Portfolio Website"),
        &100,
        &token_address,
    );
    let challenge = client.get_challenge(&challenge_id);
    assert_eq!(challenge.status, ChallengeStatus::Open);
    assert_eq!(challenge.reward_amount, 100);

    // 2. fund
    client.fund_reward_pool(&mentor, &challenge_id);
    assert_eq!(token_client.balance(&mentor), 900);
    assert_eq!(token_client.balance(&contract_id), 100);

    let challenge = client.get_challenge(&challenge_id);
    assert_eq!(challenge.status, ChallengeStatus::Funded);

    // 3. release
    client.release_reward(&mentor, &challenge_id, &learner);
    assert_eq!(token_client.balance(&learner), 100);
    assert_eq!(token_client.balance(&contract_id), 0);

    let challenge = client.get_challenge(&challenge_id);
    assert_eq!(challenge.status, ChallengeStatus::Paid);
    assert_eq!(challenge.learner, Some(learner));
}

#[test]
fn cannot_release_before_funding() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SkillPayContract);
    let client = SkillPayContractClient::new(&env, &contract_id);

    let mentor = Address::generate(&env);
    let learner = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_address, _) = create_token_contract(&env, &token_admin);

    let challenge_id = client.create_challenge(
        &mentor,
        &String::from_str(&env, "Unfunded Challenge"),
        &50,
        &token_address,
    );

    let result = client.try_release_reward(&mentor, &challenge_id, &learner);
    assert_eq!(result, Err(Ok(ContractError::NotFunded)));
}

#[test]
fn cannot_double_pay() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SkillPayContract);
    let client = SkillPayContractClient::new(&env, &contract_id);

    let mentor = Address::generate(&env);
    let learner_a = Address::generate(&env);
    let learner_b = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_address, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&mentor, &1000);

    let challenge_id = client.create_challenge(
        &mentor,
        &String::from_str(&env, "Double Pay Guard"),
        &200,
        &token_address,
    );
    client.fund_reward_pool(&mentor, &challenge_id);
    client.release_reward(&mentor, &challenge_id, &learner_a);

    let result = client.try_release_reward(&mentor, &challenge_id, &learner_b);
    assert_eq!(result, Err(Ok(ContractError::AlreadyPaid)));
}

#[test]
fn only_mentor_can_fund() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SkillPayContract);
    let client = SkillPayContractClient::new(&env, &contract_id);

    let mentor = Address::generate(&env);
    let impostor = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_address, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&impostor, &1000);

    let challenge_id = client.create_challenge(
        &mentor,
        &String::from_str(&env, "Mentor-Only Funding"),
        &75,
        &token_address,
    );

    let result = client.try_fund_reward_pool(&impostor, &challenge_id);
    assert_eq!(result, Err(Ok(ContractError::NotMentor)));
}
