const Tokens = artifacts.require("Tokens");
const Stake = artifacts.require("Staking");

contract("Staking", (accounts) => {
    let owner = accounts[0];
    let staker = accounts[1];
    let tokens;
    let staking;

    // load the contract instances.
    before(async() => {
        tokens = await Tokens.deployed();
        staking = await Stake.deployed();
    })

    it("1. Initialize the test. Distribute fungible tokens and verify contract owner.", async() => {
        // verify owner
        let contract_owner = await staking.owner();
        assert.equal(contract_owner, owner, "Address should match.");

        // distributing fungible tokens
        await tokens.safeTransferFrom(owner, staker, 0, 400, "0x0");
        // verify balance
        let balance = await tokens.balanceOf(staker, 0);
        assert.equal(balance, 400);
    })

    it("IMPORTANT: Account 1 grants contract transfer allowance.", async() => {
        await tokens.setApprovalForAll(staking.address, true, {from: staker});
        let permission = await tokens.isApprovedForAll(staker, staking.address);
        assert.equal(permission, true, "Contract should be granted permission.");
    })

    it("2. Test Stake.", async() => {
        // user attempts to stake without owning fungible tokens.
        try {
            await staking.stake(1, {from: accounts[2]});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // account 1 staking begins here.
        let expected_amount = 100;
        await staking.stake(expected_amount, {from: staker});

        // verify stake.
        let actual_amount = await staking.stakers(staker);
        assert.equal(actual_amount, expected_amount, "Amount should match.");

        // increase stake.
        let stake_more = 150;
        await staking.stake(stake_more, {from: staker});
        actual_amount = await staking.stakers(staker);
        assert.equal(actual_amount, expected_amount + stake_more, "Amount should match.");
    })

    it("3. Test contract ownership.", async() => {
        // non-owner attempts to add new nft
        try {
            await staking.addNFT(10, 10, {from: staker});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // owner adds new NFT. q = 10; p = 10
        await staking.addNFT(10, 10);

        // verify new NFT has been added into the tokens contract.
        let expected_id = 2;
        let actual_id = await tokens.get_num_of_token_types.call() - 1;
        assert.equal(actual_id, expected_id, "NFT ID should match.");

        // verify new NFT cost has been added into the staking contract.
        let expected_cost = 10;
        let actual_cost = await staking.nft_cost(expected_id);
        assert.equal(actual_cost, expected_cost, "Cost should match.");
    })

    it("4. Test unstake (withdrawal).", async() => {
        
    })
})